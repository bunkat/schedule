


schedule.schedule = function(tasks, resources, sched, startDate, endDate) {

  var taskGraph = schedule.dependencyGraph(tasks),
      resMgr = schedule.resourceManager(resources, taskGraph.resources, startDate),
      schedNext = schedule.memoizedRangeFn(later.schedule(sched).nextRange),
      scheduledTasks = {};


  function generateSchedule() {
    var end, failedTasks = [];

    forwardPass(taskGraph.roots, schedNext(startDate));

    end = getEnd(taskGraph.leaves);
    backwardPass(taskGraph.leaves, end);

    for(var i = 0, len = tasks.length; i < len; i++) {
      if(!scheduledTasks[tasks[i].id]) {
        failedTasks.push(tasks[i].id);
      }
    }

    return {
      scheduledTasks: scheduledTasks,
      failedTasks: failedTasks.length ? failedTasks : null,
      success: failedTasks.length === 0,
      end: end
    };
  }


  function getEnd(taskIds) {
    var end;

    for(var i = 0, len = taskIds.length; i < len; i++) {
      var sTask = scheduledTasks[taskIds[i]];

      if(!end || (sTask.earlyFinish > end)) {
        end = sTask.earlyFinish;
      }
    }

    return end;
  }


  function forwardPass(roots, startRange) {
    var readyTasks = [],
        dependencies = {}; // holds count and date range of met dependencies

    updateDependencies(readyTasks, dependencies, roots, startRange);
    while(readyTasks.length) {
      schedule.sort.tasks(taskGraph, readyTasks);
      var task = taskGraph.tasks[readyTasks.pop()],
          endRange = forwardPassTask(task, dependencies[task.id][1]);

      if(task.requiredBy) {
        updateDependencies(readyTasks, dependencies, task.requiredBy, endRange);
      }
    }
  }

  function updateDependencies(readyTasks, dependencies, tasks, dateRange) {
    // correct if dateRange remaining length is 0
    if(dateRange[0] === dateRange[1]) {
      dateRange = schedNext(dateRange[1]);
    }

    for(var i = 0, len = tasks.length; i < len; i++) {
      var tid = tasks[i],
          task = taskGraph.tasks[tid],
          reqDepCount = task.dependsOn ? task.dependsOn.length : 0,
          metDeps = dependencies[tid];

      if(metDeps) {
        metDeps[0] += 1;
        metDeps[1] = dateRange[0] > metDeps[1][0] ? dateRange : metDeps[1];
      }
      else {
        dependencies[tid] = [1, dateRange];
      }

      if(dependencies[tid][0] >= reqDepCount) {
        readyTasks.push(tid);
      }
    }
  }


  function forwardPassTask(task, startRange) {

    var duration = task.duration,
        start, end, timeLeft, taskEnd,
        scheduledTask = {schedule: [], duration: task.duration};

    scheduledTask.earlyStart = startRange[0];

    while(duration > 0) {
      start = startRange[0];
      end = startRange[1];
      timeLeft = (end - start) / later.MIN;
      taskEnd = timeLeft > duration ? start + (duration * later.MIN) : end;
      duration -= timeLeft;

      scheduledTask.schedule.push({
        start: start,
        end: taskEnd,
        duration: (taskEnd - start) / later.MIN
      });

      if(duration > 0) {
        startRange = schedNext(end);
      }
    }

    scheduledTask.earlyFinish = taskEnd;

    scheduledTasks[task.id] = scheduledTask;
    return [taskEnd, end];
  }


  function backwardPass(tasks, finishDate) {
    for(var i = 0, len = tasks.length; i < len; i++) {
      var task = taskGraph.tasks[tasks[i]],
          sTask = scheduledTasks[tasks[i]];

      sTask.lateFinish = finishDate;
      sTask.floatAmt = (sTask.lateFinish - sTask.earlyFinish) / later.MIN;

      if(task.dependsOn) {
        backwardPass(task.dependsOn, sTask.earlyStart);
      }
    }
  }

  return generateSchedule();
};