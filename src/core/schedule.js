

schedule.schedule = function(tasks, resources, sched, startDate, endDate) {

  var taskGraph = schedule.dependencyGraph(tasks),
      resMgr = schedule.resourceManager(resources, startDate),
      scheduledTasks = {};

  function generateSchedule() {
    var range, failedTasks = [], i, len;

    // make sure all the task resources are in the resource map
    for(i = 0, len = taskGraph.resources.length; i < len; i++) {
      var resId = taskGraph.resources[i];
      if(!resMgr.resourceMap()[resId]) {
        resMgr.setResource({id: resId}, startDate);
      }
    }

    // add the project schedule
    resMgr.setResource({id: '_proj', schedule: sched}, startDate);

    // add the task schedules
    for(i = 0, len = tasks.length; i < len; i++) {
      var task = tasks[i];
      resMgr.setResource({id: '_task' + task.id, schedule: task.schedule}, startDate);
    }

    forwardPass(taskGraph.roots);
    range = getSummary(tasks, failedTasks);
    backwardPass(taskGraph.leaves, range[1]);

    return {
      scheduledTasks: scheduledTasks,
      failedTasks: failedTasks.length ? failedTasks : null,
      success: failedTasks.length === 0,
      start: range[0],
      end: range[1]
    };
  }

  function getSummary(tasks, failedTasks) {
    var start, end;

    for(var i = 0, len = tasks.length; i < len; i++) {
      var t = scheduledTasks[tasks[i].id];
      if(!t) {
        failedTasks.push(tasks[i].id);
        continue;
      }

      start = !start || t.earlyStart < start ? t.earlyStart : start;
      end = !end || t.earlyFinish > end ? t.earlyFinish : end;
    }

    return [start, end];
  }


  function forwardPass(roots) {
    var readyTasks = roots.slice(0),
        dependencies = {}; // holds count and earliest start date of dependencies

    while(readyTasks.length) {
      schedule.sort.tasks(taskGraph, readyTasks);

      var task = taskGraph.tasks[readyTasks.pop()],
          start = dependencies[task.id] ? dependencies[task.id][1] : startDate.getTime(),
          end = forwardPassTask(task, start);

      if(end && task.requiredBy) {
        updateDependencies(readyTasks, dependencies, task.requiredBy, end);
        resMgr.moveStartDate(getMinStart(dependencies)); // clean up expired exceptions
      }
    }
  }

  function getMinStart(dependencies) {
    var min;
    for(var id in dependencies) {
      if(!min || min > dependencies[id][1]) {
        min = dependencies[id][1];
      }
    }
    return min;
  }


  function updateDependencies(readyTasks, dependencies, tasks, end) {
    for(var i = 0, len = tasks.length; i < len; i++) {
      var tid = tasks[i],
          dependsOn = taskGraph.tasks[tid].dependsOn,
          metDeps = dependencies[tid] || (dependencies[tid] = [0, 0]);

      metDeps[0] += 1;
      metDeps[1] = end > metDeps[1] ? end : metDeps[1];

      if(!dependsOn || metDeps[0] >= dependsOn.length) {
        readyTasks.push(tid);
      }
    }
  }


  function forwardPassTask(task, start) {
    var resAll = ['_proj', '_task' + task.id],
        resources = task.resources ? resAll.concat(task.resources) : resAll;
        duration = task.duration,
        next = start,
        scheduledTask = {schedule: [], duration: task.duration};

    while(duration) {
      var r = resMgr.makeReservation(resources, next, task.minSchedule || 1, duration);
      if(!r.success) return undefined;

      scheduledTask.earlyStart = scheduledTask.earlyStart || r.start;
      scheduledTask.schedule.push(r);
      duration -= r.duration;
      next = r.end;
    }

    scheduledTask.earlyFinish = next;
    scheduledTasks[task.id] = scheduledTask;

    return next;
  }


  function backwardPass(tasks, finishDate) {
    for(var i = 0, len = tasks.length; i < len; i++) {
      var sTask = scheduledTasks[tasks[i]],
          dependsOn = taskGraph.tasks[tasks[i]].dependsOn;

      sTask.lateFinish = finishDate;
      sTask.floatAmt = (sTask.lateFinish - sTask.earlyFinish) / later.MIN;

      if(dependsOn) {
        backwardPass(dependsOn, sTask.earlyStart);
      }
    }
  }

  return generateSchedule();
};