

schedule.tasks = function(taskArr) {
  var id = tasksId,
      duration = tasksDuration,
      sched = tasksSched,
      resources = tasksResources,
      dependsOn = tasksDependsOn,
      splittable = tasksSplittable;

  function tasks() {
    var items = [],
        fid = schedule.functor(id),
        fduration = schedule.functor(duration),
        fsched = schedule.functor(sched),
        fresources = schedule.functor(resources),
        fdependsOn = schedule.functor(dependsOn),
        fsplittable = schedule.functor(splittable);

    for(var i = 0, len = taskArr.length; i < len; i++) {
      var task = taskArr[i],
          item = {
            id: fid.call(this, task, i),
            duration: fduration.call(this, task, i),
            schedule: fsched.call(this, task, i),
            resources: fresources.call(this, task, i),
            dependsOn: fdependsOn.call(this, task, i),
            splittable: fsplittable.call(this, task, i)
          };

      items.push(item);
    }

    return map;
  }

  tasks.id = function(_) {
    if (!arguments.length) return id;
    id = _;
    return tasks;
  };

  tasks.duration = function(_) {
    if (!arguments.length) return duration;
    duration = _;
    return tasks;
  };

  tasks.schedule = function(_) {
    if (!arguments.length) return sched;
    sched = _;
    return tasks;
  };

  tasks.resources = function(_) {
    if (!arguments.length) return resources;
    resources = _;
    return tasks;
  };

  tasks.dependsOn = function(_) {
    if (!arguments.length) return dependsOn;
    dependsOn = _;
    return tasks;
  };

  tasks.splittable = function(_) {
    if (!arguments.length) return splittable;
    splittable = _;
    return tasks;
  };

  return tasks;
};

function tasksId(d) {
  return d.id;
}

function tasksDuration(d) {
  return d.id;
}

function tasksSched(d) {
  return d.schedule;
}

function tasksResources(d) {
  return d.resources;
}

function tasksDependsOn(d) {
  return d.dependsOn;
}

function tasksSplittable(d) {
  return d.splittable;
}

