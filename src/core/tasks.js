/**
* Tasks
* (c) 2013 Bill, BunKat LLC.
*
* Takes an array of objects and generates an of array valid schedule task objects.
*
* Schedule is freely distributable under the MIT license.
* For all details and documentation:
*     http://github.com/bunkat/schedule
*/

schedule.tasks = function() {
  var id = tasksId,
      duration = tasksDuration,
      available = tasksAvailable,
      resources = tasksResources,
      dependsOn = tasksDependsOn,
      minSchedule = tasksMinSchedule,
      priority = tasksPriority;

  /**
  * Takes an array of objects and returns an array of schedule task objects.
  */
  function tasks(data) {
    var items = [],
        fid = schedule.functor(id),
        fduration = schedule.functor(duration),
        favailable = schedule.functor(available),
        fresources = schedule.functor(resources),
        fdependsOn = schedule.functor(dependsOn),
        fminschedule = schedule.functor(minSchedule),
        fpriority = schedule.functor(priority);

    for(var i = 0, len = data.length; i < len; i++) {
      var task = data[i],
          item = {
            id: fid.call(this, task, i),
            duration: fduration.call(this, task, i),
            available: favailable.call(this, task, i),
            resources: fresources.call(this, task, i),
            dependsOn: fdependsOn.call(this, task, i),
            minSchedule: fminschedule.call(this, task, i),
            priority: fpriority.call(this, task, i)
          };

      items.push(item);
    }

    return items;
  }

  /**
  * The function or value that should be used to generate the task id. Sets the
  * value to the argument passed in, returns current value if no arguments are
  * passed in.
  */
  tasks.id = function(_) {
    if (!arguments.length) return id;
    id = _;
    return tasks;
  };

  /**
  * The function or value that should be used to generate the task duration. Sets the
  * value to the argument passed in, returns current value if no arguments are
  * passed in.
  */
  tasks.duration = function(_) {
    if (!arguments.length) return duration;
    duration = _;
    return tasks;
  };

  /**
  * The function or value that should be used to generate the task schedule. The
  * schedule must be a valid Later.js schedule. Sets the value to the argument
  * passed in, returns current value if no arguments are passed in.
  */
  tasks.available = function(_) {
    if (!arguments.length) return available;
    available = _;
    return tasks;
  };

  /**
  * The function or value that should be used to generate the resources array. Sets the
  * value to the argument passed in, returns current value if no arguments are
  * passed in.
  */
  tasks.resources = function(_) {
    if (!arguments.length) return resources;
    resources = _;
    return tasks;
  };

  /**
  * The function or value that should be used to generate the dependency array. Sets the
  * value to the argument passed in, returns current value if no arguments are
  * passed in.
  */
  tasks.dependsOn = function(_) {
    if (!arguments.length) return dependsOn;
    dependsOn = _;
    return tasks;
  };

  /**
  * The function or value that should be used to generate the min schedule. Sets the
  * value to the argument passed in, returns current value if no arguments are
  * passed in.
  */
  tasks.minSchedule = function(_) {
    if (!arguments.length) return minSchedule;
    minSchedule = _;
    return tasks;
  };

  /**
  * The function or value that should be used to generate the priority. Sets the
  * value to the argument passed in, returns current value if no arguments are
  * passed in.
  */
  tasks.priority = function(_) {
    if (!arguments.length) return priority;
    priority = _;
    return tasks;
  };

  return tasks;
};

/**
* The default id function.
*/
function tasksId(d) {
  return d.id;
}

/**
* The default duration function.
*/
function tasksDuration(d) {
  return d.duration;
}

/**
* The default schedule function.
*/
function tasksAvailable(d) {
  return d.available;
}

/**
* The default resources function.
*/
function tasksResources(d) {
  return d.resources;
}

/**
* The default depends on function.
*/
function tasksDependsOn(d) {
  return d.dependsOn;
}

/**
* The default min schedule function.
*/
function tasksMinSchedule(d) {
  return d.minSchedule;
}

/**
* The default priority function.
*/
function tasksPriority(d) {
  return d.priority;
}
