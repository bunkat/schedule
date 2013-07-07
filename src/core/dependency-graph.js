/**
* Dependency graph
* (c) 2013 Bill, BunKat LLC.
*
* Generates a dependency graph from a set of tasks and finds the root nodes,
* leaf nodes, depth, and optimistic float (time between when a schedule starts
* and when it must start to prevent a schedule slip). This information is used
* by the schedule generator to schedule tasks against an actual timeline.
*
* Schedule is freely distributable under the MIT license.
* For all details and documentation:
*     http://github.com/bunkat/schedule
*/

schedule.dependencyGraph = function(taskArr) {

  /**
  * Starting point for creating the dependency graph, clones the tasks and
  * then fills out the graph properties.
  */
  function createDependencyGraph(tasks) {
    var graph = {
      tasks: {},
      roots: [],
      leaves: [],
      resources: [],
      depth: 0,
      end : 0
    };

    for(var i = 0, len = tasks.length; i < len; i++) {
      var t = tasks[i];
      graph.tasks[t.id] = {
        id: t.id,
        duration: t.duration,
        priority: t.priority,
        schedule: t.schedule,
        minSchedule: t.minSchedule,
        dependsOn: t.dependsOn,
        resources: t.resources
      };
    }

    setResources(graph);
    setRequiredBy(graph.tasks);
    setRootsAndLeaves(graph);

    setDepth(graph, graph.leaves, 0);
    graph.depth += 1; // increment depth so it is 1 based

    forwardPass(graph, {}, graph.roots, 0);
    setEnd(graph, graph.leaves);
    backwardPass(graph, {}, graph.leaves, graph.end);

    return graph;
  }

  /**
  * Creates an array of all the unique resources that are used by the tasks.
  */
  function setResources(graph) {
    for(var id in graph.tasks) {
      var task = graph.tasks[id];
      if(!isEmpty(task.resources)) {
        for(var i = 0, len = task.resources.length; i < len; i++) {
          var resId = task.resources[i];
          if(graph.resources.indexOf(resId) === -1) {
            graph.resources.push(resId);
          }
        }
      }
    }
  }

  /**
  * Creates the back links from child to parent based on the dependsOn property.
  */
  function setRequiredBy(tasks) {
    for(var id in tasks) {
      var child = tasks[id],
          dependsOn = child.dependsOn;

      if(!isEmpty(dependsOn)) {
        for(var i = 0, len = dependsOn.length; i < len; i++) {
          var parent = tasks[dependsOn[i]];
          (parent.requiredBy || (parent.requiredBy = [])).push(child.id);
        }
      }
    }
  }

  /**
  * Finds the roots and leaves of the dependency graph.
  */
  function setRootsAndLeaves(graph) {
    for(var id in graph.tasks) {
      var task = graph.tasks[id];

      if(isEmpty(task.dependsOn)) {
        graph.roots.push(task.id);
      }

      if(isEmpty(task.requiredBy)) {
        graph.leaves.push(task.id);
      }
    }
  }

  /**
  * Determines the depth (maximum number of nodes that depend on the current
  * node) of each node in the dependency graph.
  */
  function setDepth(graph, tasks, depth) {
    for(var i = 0, len = tasks.length; i < len; i++) {
      var task = graph.tasks[tasks[i]],
          dependsOn = task.dependsOn;

      task.depth = !task.depth || depth > task.depth ? depth : task.depth;
      graph.depth = depth > graph.depth ? depth : graph.depth;

      if(!isEmpty(dependsOn)) {
        setDepth(graph, dependsOn, task.depth + 1);
      }
    }
  }

  /**
  * Generates an optimistic (assume all resources are available when needed)
  * forward schedule for each node in the graph, respecting node dependencies.
  */
  function forwardPass(graph, depEnds, tasks, start) {
    updateDependencies(depEnds, tasks, start);
    for(var i = 0, len = tasks.length; i < len; i++) {
      var tid = tasks[i],
          task = graph.tasks[tid],
          dependsOn = task.dependsOn,
          dep = depEnds[tid];

      if(!task.earlyFinish && (isEmpty(dependsOn) || (dep && dep[0] === dependsOn.length))) {
        task.earlyStart = dep[1];
        task.earlyFinish = dep[1] + task.duration;

        if(!isEmpty(task.requiredBy)) {
          forwardPass(graph, depEnds, task.requiredBy, task.earlyFinish);
        }
      }
    }
  }

  /**
  * Finds the end of the optimistic forward pass schedule.
  */
  function setEnd(graph, tasks) {
    for(var i = 0, len = tasks.length; i < len; i++) {
      var finish = graph.tasks[tasks[i]].earlyFinish;
      graph.end = finish > graph.end ? finish : graph.end;
    }
  }

  /**
  * Generates an optimistic (assume all resources are available when needed)
  * backward schedule for each node in the graph, respecting node dependencies.
  * Computes the float (time between earliest finish and latest finish).
  */
  function backwardPass(graph, depEnds, tasks, end) {
    updateDependencies(depEnds, tasks, end, true);
    for(var i = 0, len = tasks.length; i < len; i++) {
      var tid = tasks[i],
          task = graph.tasks[tid],
          requiredBy = task.requiredBy,
          dep = depEnds[tid];

      if(isEmpty(requiredBy) || (dep && dep[0] === requiredBy.length)) {
        task.lateStart = dep[1] - task.duration;
        task.lateFinish = dep[1];
        task.floatAmt = task.lateFinish - task.earlyFinish;

        if(!isEmpty(task.dependsOn)) {
          backwardPass(graph, depEnds, task.dependsOn, task.lateStart);
        }
      }
    }
  }

  /**
  * Tracks dependencies between nodes to ensure nodes are only scheduled once
  * their dependencies have completed.
  */
  function updateDependencies(deps, tasks, start, rev) {
    var compare = rev ? function(a,b) { return b > a; } :
                        function(a,b) { return a > b; };

    for(var i = 0, len = tasks.length; i < len; i++) {
      var id = tasks[i];

      if(deps[id]) {
        deps[id][0] = deps[id][0] + 1;
        deps[id][1] = compare(start, deps[id][1]) ? start : deps[id][1];
      }
      else {
        deps[id] = [1, start];
      }
    }
  }

  /**
  * Returns true if the array is undefined or empty.
  */
  function isEmpty(arr) {
    return !arr || arr.length === 0;
  }

  return createDependencyGraph(taskArr);
};