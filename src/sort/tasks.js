


schedule.sort.tasks = function(taskGraph, readyTasks) {
  readyTasks.sort(function(a,b) {
    return taskGraph.tasks[b].floatAmt > taskGraph.tasks[a].floatAmt;
  });
};