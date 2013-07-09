/**
* Schedule create
* (c) 2013 Bill, BunKat LLC.
*
* Creates a schedule for each task that respects the task schedules, task
* dependencies, resource schedules, project schedule, and start date provided.
*
* Schedule is freely distributable under the MIT license.
* For all details and documentation:
*     http://github.com/bunkat/schedule
*/

schedule.create = function(tasks, resources, sched, scheduleStart) {
  if(!Array.isArray(tasks)) {
    throw new Error('Tasks are required and must be passed in as an array.');
  }

  if(resources && !Array.isArray(resources)) {
    throw new Error('Resources must be passed in as an array.');
  }

  var startDate = scheduleStart ? new Date(scheduleStart) : new Date();
  if(!startDate || !startDate.getTime()) {
    throw new Error('Invalid start date specified.');
  }

  var taskGraph = schedule.dependencyGraph(tasks),
      resMgr = schedule.resourceManager(resources, startDate),
      scheduledTasks = {};

  /**
  * Main function, coordinates the process of creating a schedule.
  */
  function generateSchedule() {
    var range, failedTasks = [];

    // add required resources not supplied in resources array, the project
    // schedule and all task schedules to the resource manager (these will
    // be treated as resources to calculate valid reservations with)
    resMgr.addResource(taskGraph.resources, '', startDate);
    resMgr.addResource([{id: '_proj', available: sched}], '', startDate);
    resMgr.addResource(tasks, '_task', startDate);

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

  /**
  * Schedules each task as their dependencies are met, tracking dependency
  * end dates in the dependencies map.
  */
  function forwardPass(roots) {
    var readyTasks = roots.slice(0),
        dependencies = {}; // holds count and earliest start date of dependencies

    for(var i = 0, len = roots.length; i < len; i++) {
      dependencies[roots[i]] = [0, startDate.getTime()];
    }

    while(readyTasks.length) {
      schedule.sort.tasks(taskGraph, readyTasks);

      var task = taskGraph.tasks[readyTasks.pop()],
          start = dependencies[task.id][1],
          end = forwardPassTask(task, start);

      if(end && task.requiredBy) {
        updateDependencies(readyTasks, dependencies, task.requiredBy, end);
        resMgr.optimize(getMinStart(dependencies)); // clean up expired exceptions
      }
    }
  }

  /**
  * Finds the next available time that all of a tasks constraints are met and
  * makes the appropriate resource reservations. A task may be scheduled in a
  * single contiguous block or multiple blocks of time.
  */
  function forwardPassTask(task, start) {
    var resAll = ['_proj', '_task' + task.id],
        resources = task.resources ? resAll.concat(task.resources) : resAll,
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

  /**
  * Finds the start and end date of the schedule and adds any tasks that were
  * scheduled to the failedTasks array.
  */
  function getSummary(tasks, failedTasks) {
    var start, end;

    for(var i = 0, len = tasks.length; i < len; i++) {
      var t = scheduledTasks[tasks[i].id];
      if(t) {
        start = !start || t.earlyStart < start ? t.earlyStart : start;
        end = !end || t.earlyFinish > end ? t.earlyFinish : end;
      }
      else {
        failedTasks.push(tasks[i].id);
      }
    }

    return [start, end];
  }

  /**
  * As tasks are scheduled, the information is tracked in the dependencies
  * array. As a tasks dependencies are all met, the task is pushed onto the
  * readyTasks array which means it is available to be scheduled.
  */
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

  /**
  * Finds the earliest time that any of the remaining tasks could be scheduled
  * for. It is used to optimize the resource manager since nothing can be
  * scheduled before this time.
  */
  function getMinStart(dependencies) {
    var min;
    for(var id in dependencies) {
      if(!min || min > dependencies[id][1]) {
        min = dependencies[id][1];
      }
    }
    return min;
  }

  /**
  * Calculates when a task must be completed by before it ends up slipping
  * one of its dependencies or the schedule. Tasks with zero float amount
  * are in the critical path.
  */
  function backwardPass(tasks, finishDate) {
    for(var i = 0, len = tasks.length; i < len; i++) {
      var sTask = scheduledTasks[tasks[i]],
          dependsOn = taskGraph.tasks[tasks[i]].dependsOn;

      if(sTask) {
        sTask.lateFinish = finishDate;
        sTask.floatAmt = (sTask.lateFinish - sTask.earlyFinish) / later.MIN;

        if(dependsOn) {
          backwardPass(dependsOn, sTask.earlyStart);
        }
      }
    }
  }

  return generateSchedule();
};