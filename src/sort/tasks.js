


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