/**
* Sort tasks
* (c) 2013 Bill, BunKat LLC.
*
* Determines the order that tasks are scheduled in when multiple tasks can be
* scheduled in parallel. Default it to do highest priority tasks first, then
* tasks that have been determined to have the largest float.
*
* Schedule is freely distributable under the MIT license.
* For all details and documentation:
*     http://github.com/bunkat/schedule
*/

schedule.sort.tasks = function(taskGraph, readyTasks) {
  readyTasks.sort(function(a,b) {
    var ta = taskGraph.tasks[a],
        tb = taskGraph.tasks[b];

    if(tb.priority && (!ta.priority || tb.priority > ta.priority)) {
      return -1;
    }

    if(ta.priority && (!tb.priority || ta.priority > tb.priority)) {
      return 1;
    }

    return taskGraph.tasks[b].floatAmt > taskGraph.tasks[a].floatAmt;
  });
};