

schedule.dependencyGraph = function(taskArr) {

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
      graph.tasks[tasks[i].id] = tasks[i];
    }

    setResources(graph);
    setRequiredBy(graph.tasks);
    setRootsAndLeaves(graph);

    setDepth(graph, graph.leaves, 0);
    graph.depth += 1;

    forwardPass(graph, {}, graph.roots, 0);
    setEnd(graph, graph.leaves);
    backwardPass(graph, {}, graph.leaves, graph.end);

    return graph;
  }


  function setResources(graph) {
    for(var id in graph.tasks) {
      var task = graph.tasks[id];
      if(task.resources) {
        for(var i = 0, len = task.resources.length; i < len; i++) {
          var resId = task.resources[i];
          if(graph.resources.indexOf(resId) === -1) {
            graph.resources.push(resId);
          }
        }
      }
    }
  }


  function setEnd(graph, tasks) {
    for(var i = 0, len = tasks.length; i < len; i++) {
      var finish = graph.tasks[tasks[i]].earlyFinish;
      graph.end = finish > graph.end ? finish : graph.end;
    }
  }


  function setRequiredBy(tasks) {
    for(var id in tasks) {
      var child = tasks[id],
          dependsOn = child.dependsOn;

      if(dependsOn) {
        for(var i = 0, len = dependsOn.length; i < len; i++) {
          var parent = tasks[dependsOn[i]];
          (parent.requiredBy || (parent.requiredBy = [])).push(child.id);
        }
      }
    }
  }

  function setRootsAndLeaves(graph) {
    for(var id in graph.tasks) {
      var task = graph.tasks[id];

      if(!task.dependsOn || task.dependsOn.length === 0) {
        graph.roots.push(task.id);
      }

      if(!task.requiredBy || task.requiredBy.length === 0) {
        graph.leaves.push(task.id);
      }
    }
  }

  function setDepth(graph, tasks, depth) {
    for(var i = 0, len = tasks.length; i < len; i++) {
      var task = graph.tasks[tasks[i]],
          dependsOn = task.dependsOn;

      task.depth = !task.depth || depth > task.depth ? depth : task.depth;
      graph.depth = depth > graph.depth ? depth : graph.depth;

      if(dependsOn) {
        setDepth(graph, dependsOn, task.depth + 1);
      }
    }
  }

  function forwardPass(graph, depEnds, tasks, start) {
    updateDependencies(depEnds, tasks, start);
    for(var i = 0, len = tasks.length; i < len; i++) {
      var tid = tasks[i],
          task = graph.tasks[tid],
          dependsOn = task.dependsOn,
          dep = depEnds[tid];

      if(!task.earlyFinish && (!dependsOn || (dep && dep[0] === dependsOn.length))) {
        task.earlyStart = dep[1];
        task.earlyFinish = dep[1] + task.duration;

        if(task.requiredBy) {
          forwardPass(graph, depEnds, task.requiredBy, task.earlyFinish);
        }
      }
    }
  }

  function backwardPass(graph, depEnds, tasks, end) {
    updateDependencies(depEnds, tasks, end, true);
    for(var i = 0, len = tasks.length; i < len; i++) {
      var tid = tasks[i],
          task = graph.tasks[tid],
          requiredBy = task.requiredBy,
          dep = depEnds[tid];

      if(!requiredBy || (dep && dep[0] === requiredBy.length)) {
        task.lateStart = dep[1] - task.duration;
        task.lateFinish = dep[1];
        task.floatAmt = task.lateFinish - task.earlyFinish;

        if(task.dependsOn) {
          backwardPass(graph, depEnds, task.dependsOn, task.lateStart);
        }
      }
    }
  }

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

  return createDependencyGraph(taskArr);
};