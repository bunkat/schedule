var later = require('later');


schedule.schedule = function(tasks, resources, workSchedule, startDate, endDate) {

  var taskGraph = schedule.dependencyGraph(tasks),
      resMgr = schedule.resourceManager(taskGraph.resources, resources),

      scheduledTasks = {},
      sched = later.schedule(schedDef),
      nextFn = memoizedFn(sched.nextRange),
      prevFn = memoizedFn(sched.prevRange);

  function buildSchedule() {
    forwardPass(graph.roots, nextFn(startDate));
    var end = getEnd(graph, graph.leaves);
    backwardPass(graph.leaves, prevFn(end));
    return scheduledTasks;
  }

  function getEnd(graph, tasks) {
    var end = 0;

    for(var i = 0, len = tasks.length; i < len; i++) {
      var finish = scheduledTasks[tasks[i]].earlyFinish;
      end = finish > end ? finish : end;
    }

    return end;
  }

  function sortActive(activeArr) {
    activeArr.sort(function(a,b) {
      return graph.tasks[b].floatAmt > graph.tasks[a].floatAmt;
    });
  }


  function forwardPass(rootTasks, startRange) {
    var activeArr = [],
        deps = {};

    updateDependencies(activeArr, deps, rootTasks, startRange);
    while(activeArr.length) {
      sortActive(activeArr);
      var t = graph.tasks[activeArr.pop()],
          endRange = forwardPassTask(activeArr, t, deps);

      if(t.requiredBy) {
        updateDependencies(activeArr, deps, t.requiredBy, endRange);
      }
    }
  }

  function forwardPassTask(activeArr, t, deps) {
    var startRange = deps[t.id][1],
        start = startRange[0],
        end = startRange[1],
        scheduledTask = {earlySchedule: [], duration: t.duration};

    startRange = start.getTime() === end.getTime() ? nextFn(end) : startRange;
    var timeLeft = (end.getTime() - start.getTime()) / later.MIN,
        duration = t.duration;

    scheduledTask.earlyStart = start;

    while(duration > timeLeft) {
      scheduledTask.earlySchedule.push(block(start, end, timeLeft));
      duration -= timeLeft;
      startRange = nextFn(end);
      start = startRange[0];
      end = startRange[1];
      timeLeft = (end.getTime() - start.getTime()) / later.MIN;
    }

    scheduledTask.earlyFinish = new Date(start.getTime() + (duration * later.MIN));
    scheduledTask.earlySchedule.push(block(start, scheduledTask.earlyFinish, duration));

    scheduledTasks[t.id] = scheduledTask;
    order.push(t.id);
    return [scheduledTask.earlyFinish, end];
  }


  function backwardPass(leafTasks, startRange) {
    var activeArr = [],
        deps = {};

    updateDependencies(activeArr, deps, leafTasks, startRange, true);
    while(order.length) {

      var t = graph.tasks[order.pop()],
          endRange = backwardPassTask(activeArr, t, deps);

      if(t.dependsOn) {
        updateDependencies(activeArr, deps, t.dependsOn, endRange, true);
      }
    }
  }


/*  function backwardPassTask(activeArr, t, deps) {
    var startRange = deps[t.id][1],
        start = startRange[0],
        end = startRange[1],
        scheduledTask = scheduledTasks[t.id];

    scheduledTask.lateFinish = end;
    scheduledTask.lateStart = new Date(end.getTime() - (scheduledTask.duration * later.MIN));
    scheduledTask.floatAmt = calcFloat(scheduledTask.earlyFinish, scheduledTask.lateFinish);

    return [start, scheduledTask.lateStart];
  }*/




  function backwardPassTask(activeArr, t, deps) {
    var startRange = deps[t.id][1],
        start = startRange[0],
        end = startRange[1],
        scheduledTask = scheduledTasks[t.id];

    scheduledTask.lateSchedule = [];

    startRange = start.getTime() === end.getTime() ? prevFn(start.getTime() - later.SEC) : startRange;
    start = startRange[0];
    end = startRange[1];

    var timeLeft = (end.getTime() - start.getTime()) / later.MIN,
        duration = t.duration;

    scheduledTask.lateFinish = end;

    while(duration > timeLeft) {
      scheduledTask.lateSchedule.push(block(start, end, timeLeft));
      duration -= timeLeft;
      startRange = prevFn(start.getTime() - later.SEC);
      start = startRange[0];
      end = startRange[1];
      timeLeft = (end.getTime() - start.getTime()) / later.MIN;
    }

    scheduledTask.lateStart = new Date(end.getTime() - (duration * later.MIN));
    scheduledTask.lateSchedule.push(block(scheduledTask.lateStart, end, duration));
    scheduledTask.floatAmt = calcFloat(scheduledTask.earlyFinish, scheduledTask.lateFinish);

    return [start, scheduledTask.lateStart];
  }

  function calcFloat(start, end) {
    return (end.getTime() - start.getTime()) / later.DAY;
  }

  function updateDependencies(activeArr, deps, arr, range, rev) {
    var compare = rev ? function(a,b) { return b > a; } :
                        function(a,b) { return a > b; },
        countProp = rev ? 'requiredBy' : 'dependsOn',
        rangeId = rev ? 1 : 0;

    for(var i = 0, len = arr.length; i < len; i++) {
      var tid = arr[i];
      if(deps[tid]) {
        deps[tid][0] += 1;
        deps[tid][1] = compare(range[rangeId], deps[tid][1][rangeId]) ? range : deps[tid][1];
      }
      else {
        deps[tid] = [1, range];
      }

      var task = graph.tasks[tid],
          count = task[countProp] ? task[countProp].length : 0;

      if(deps[tid][0] >= count) {
        activeArr.push(tid);
      }
    }
  }

  function block(start, end, duration) {
    return {
      start: start,
      end: end,
      duration: duration
    };
  }

  // quick and dirty function memoization
  function memoizedFn(fn) {
    var cache = {};

    return function(start) {
      //return fn(1, start);
      return cache[start] || (cache[start] = fn(1, start));
    };
  }

  return buildSchedule();
};