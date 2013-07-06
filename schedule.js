schedule = function() {
  var schedule = {
    version: "0.6.0"
  };
  var later = !later && require ? require("later") : later;
  if (!Array.isArray) {
    Array.isArray = function(vArg) {
      return Object.prototype.toString.call(vArg) === "[object Array]";
    };
  }
  schedule.date = {};
  schedule.date.UTC = function() {
    later.date.UTC();
  };
  schedule.date.localTime = function() {
    later.date.localTime();
  };
  schedule.functor = function(v) {
    return typeof v === "function" ? v : function() {
      return v;
    };
  };
  schedule.memoizedRangeFn = function(fn) {
    var cache = {};
    return function(start) {
      if (!cache[start]) {
        var result = fn(1, start);
        cache[start] = [ result[0].getTime(), result[1] ? result[1].getTime() : 41024448e5 ];
      }
      return cache[start];
    };
  };
  schedule.sort = {};
  schedule.sort.tasks = function(taskGraph, readyTasks) {
    readyTasks.sort(function(a, b) {
      var ta = taskGraph.tasks[a], tb = taskGraph.tasks[b];
      if (tb.priority && (!ta.priority || tb.priority > ta.priority)) {
        return -1;
      }
      if (ta.priority && (!tb.priority || ta.priority > tb.priority)) {
        return 1;
      }
      return taskGraph.tasks[b].floatAmt > taskGraph.tasks[a].floatAmt;
    });
  };
  schedule.resources = function(resourceArr) {
    var id = resourcesId, sched = resourcesSched, isNotReservable = resourcesIsNotReservable;
    function resources() {
      var map = {}, fid = schedule.functor(id), fsched = schedule.functor(sched), freserve = schedule.functor(isNotReservable);
      for (var i = 0, len = resourceArr.length; i < len; i++) {
        var resource = resourceArr[i], rId = fid.call(this, resource, i), rSched = fsched.call(this, resource, i), rReserve = freserve.call(this, resource, i);
        map[rId] = {
          id: rId,
          schedule: rSched,
          isNotReservable: rReserve
        };
      }
      return map;
    }
    resources.id = function(_) {
      if (!arguments.length) return id;
      id = _;
      return resources;
    };
    resources.schedule = function(_) {
      if (!arguments.length) return sched;
      sched = _;
      return resources;
    };
    resources.isNotReservable = function(_) {
      if (!arguments.length) return isNotReservable;
      isNotReservable = _;
      return resources;
    };
    return resources;
  };
  function resourcesId(d) {
    return d.id;
  }
  function resourcesSched(d) {
    return d.schedule;
  }
  function resourcesIsNotReservable(d) {
    return d.isNotReservable || false;
  }
  schedule.tasks = function(taskArr) {
    var id = tasksId, duration = tasksDuration, sched = tasksSched, resources = tasksResources, dependsOn = tasksDependsOn, splittable = tasksSplittable;
    function tasks() {
      var items = [], fid = schedule.functor(id), fduration = schedule.functor(duration), fsched = schedule.functor(sched), fresources = schedule.functor(resources), fdependsOn = schedule.functor(dependsOn), fsplittable = schedule.functor(splittable);
      for (var i = 0, len = taskArr.length; i < len; i++) {
        var task = taskArr[i], item = {
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
  schedule.dependencyGraph = function(taskArr) {
    function createDependencyGraph(tasks) {
      var graph = {
        tasks: {},
        roots: [],
        leaves: [],
        resources: [],
        depth: 0,
        end: 0
      };
      for (var i = 0, len = tasks.length; i < len; i++) {
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
      for (var id in graph.tasks) {
        var task = graph.tasks[id];
        if (task.resources) {
          for (var i = 0, len = task.resources.length; i < len; i++) {
            var resId = task.resources[i];
            if (graph.resources.indexOf(resId) === -1) {
              graph.resources.push(resId);
            }
          }
        }
      }
    }
    function setEnd(graph, tasks) {
      for (var i = 0, len = tasks.length; i < len; i++) {
        var finish = graph.tasks[tasks[i]].earlyFinish;
        graph.end = finish > graph.end ? finish : graph.end;
      }
    }
    function setRequiredBy(tasks) {
      for (var id in tasks) {
        var child = tasks[id], dependsOn = child.dependsOn;
        if (dependsOn) {
          for (var i = 0, len = dependsOn.length; i < len; i++) {
            var parent = tasks[dependsOn[i]];
            (parent.requiredBy || (parent.requiredBy = [])).push(child.id);
          }
        }
      }
    }
    function setRootsAndLeaves(graph) {
      for (var id in graph.tasks) {
        var task = graph.tasks[id];
        if (!task.dependsOn || task.dependsOn.length === 0) {
          graph.roots.push(task.id);
        }
        if (!task.requiredBy || task.requiredBy.length === 0) {
          graph.leaves.push(task.id);
        }
      }
    }
    function setDepth(graph, tasks, depth) {
      for (var i = 0, len = tasks.length; i < len; i++) {
        var task = graph.tasks[tasks[i]], dependsOn = task.dependsOn;
        task.depth = !task.depth || depth > task.depth ? depth : task.depth;
        graph.depth = depth > graph.depth ? depth : graph.depth;
        if (dependsOn) {
          setDepth(graph, dependsOn, task.depth + 1);
        }
      }
    }
    function forwardPass(graph, depEnds, tasks, start) {
      updateDependencies(depEnds, tasks, start);
      for (var i = 0, len = tasks.length; i < len; i++) {
        var tid = tasks[i], task = graph.tasks[tid], dependsOn = task.dependsOn, dep = depEnds[tid];
        if (!task.earlyFinish && (!dependsOn || dep && dep[0] === dependsOn.length)) {
          task.earlyStart = dep[1];
          task.earlyFinish = dep[1] + task.duration;
          if (task.requiredBy) {
            forwardPass(graph, depEnds, task.requiredBy, task.earlyFinish);
          }
        }
      }
    }
    function backwardPass(graph, depEnds, tasks, end) {
      updateDependencies(depEnds, tasks, end, true);
      for (var i = 0, len = tasks.length; i < len; i++) {
        var tid = tasks[i], task = graph.tasks[tid], requiredBy = task.requiredBy, dep = depEnds[tid];
        if (!requiredBy || dep && dep[0] === requiredBy.length) {
          task.lateStart = dep[1] - task.duration;
          task.lateFinish = dep[1];
          task.floatAmt = task.lateFinish - task.earlyFinish;
          if (task.dependsOn) {
            backwardPass(graph, depEnds, task.dependsOn, task.lateStart);
          }
        }
      }
    }
    function updateDependencies(deps, tasks, start, rev) {
      var compare = rev ? function(a, b) {
        return b > a;
      } : function(a, b) {
        return a > b;
      };
      for (var i = 0, len = tasks.length; i < len; i++) {
        var id = tasks[i];
        if (deps[id]) {
          deps[id][0] = deps[id][0] + 1;
          deps[id][1] = compare(start, deps[id][1]) ? start : deps[id][1];
        } else {
          deps[id] = [ 1, start ];
        }
      }
    }
    return createDependencyGraph(taskArr);
  };
  schedule.resourceManager = function(resourceDefinitions, startDate) {
    var defaultSched = {
      schedules: [ {
        fd_a: [ startDate.getTime() ]
      } ]
    }, rMap = buildResourceMap(resourceDefinitions, startDate);
    function buildResourceMap(resourceDefinitions, start) {
      var map = {}, i, len;
      if (resourceDefinitions) {
        for (i = 0, len = resourceDefinitions.length; i < len; i++) {
          addResourceToMap(map, resourceDefinitions[i], start);
        }
      }
      return map;
    }
    function addResourceToMap(map, def, start) {
      var sched = JSON.parse(JSON.stringify(def.schedule || defaultSched)), nextFn = schedule.memoizedRangeFn(later.schedule(sched).nextRange);
      map[def.id] = {
        schedule: sched,
        next: nextFn,
        nextAvail: nextFn(start)
      };
    }
    function getReservation(resources, start, min, max) {
      var reservation, schedules = [], delays = {};
      maxTries = 50;
      initRanges(resources, start, schedules, delays);
      while (!(reservation = tryReservation(schedules, min, max)).success && --maxTries) {
        updateRanges(schedules, nextValidStart(schedules), delays);
        reservation.delays = delays;
      }
      return reservation;
    }
    function tryReservation(schedules, min, max) {
      var reservation = {
        success: false
      }, resources = [], start, end;
      for (var i = 0, len = schedules.length; i < len; i++) {
        var schedule = schedules[i], range = schedule.range;
        if (!range) return {
          success: false
        };
        if (schedule.id[0] !== "_") {
          resources.push(schedule.id);
        }
        start = !start || range[0] > start ? range[0] : start;
        end = !end || range[1] < end ? range[1] : end;
      }
      var duration = (end - start) / later.MIN;
      if (duration >= min) {
        duration = max && duration > max ? max : duration;
        end = start + duration * later.MIN;
        reservation = {
          resources: resources,
          start: start,
          end: end,
          duration: duration,
          success: true
        };
        applyReservation(resources, start, end);
      }
      return reservation;
    }
    function updateRanges(resources, start, delays) {
      for (var i = 0, len = resources.length; i < len; i++) {
        var res = resources[i];
        if (res.range[1] <= start) {
          if (res.subRanges) {
            updateRanges(res.subRanges, start, {});
            setEarliestSubRange(res);
          } else {
            res.range = rMap[res.id].next(start);
            if (res.id !== "_proj" && !delays[res.id]) {
              delays[res.id] = {
                needed: new Date(start),
                available: new Date(res.range[0])
              };
            }
          }
        }
      }
    }
    function setEarliestSubRange(schedule) {
      var minId, minRange;
      for (var i = 0, len = schedule.subRanges.length; i < len; i++) {
        var sub = schedule.subRanges[i];
        if (!minId || sub.range[0] < minRange[0]) {
          minId = sub.id;
          minRange = sub.range;
        }
      }
      schedule.id = minId;
      schedule.range = minRange;
    }
    function nextValidStart(schedules) {
      var latest;
      for (var i = 0, len = schedules.length; i < len; i++) {
        var end = schedules[i].range[1];
        latest = !latest || end < latest ? end : latest;
      }
      return latest;
    }
    function getLongestDelay(delays) {
      var latest, lid;
      for (var id in delays) {
        var available = delays[id].available;
        if (!latest || available < latest) {
          latest = available;
          lid = id;
        }
      }
      return lid;
    }
    function initRanges(resources, start, ranges, delays) {
      for (var i = 0, len = resources.length; i < len; i++) {
        var resId = resources[i];
        if (Array.isArray(resId)) {
          var subRanges = [], subDelays = {};
          initRanges(resId, start, subRanges, subDelays);
          var longDelay = getLongestDelay(subDelays);
          delays[longDelay] = subDelays[longDelay];
          var schedule = {
            subRanges: subRanges
          };
          setEarliestSubRange(schedule);
          ranges.push(schedule);
        } else {
          var res = rMap[resId], range = res.nextAvail[0] >= start ? res.nextAvail : res.next(start);
          if (range[0] > start && resId !== "_proj") {
            delays[resId] = {
              needed: new Date(start),
              available: new Date(range[0])
            };
          }
          ranges.push({
            id: resId,
            range: range
          });
        }
      }
    }
    function applyReservation(resources, start, end) {
      for (var i = 0, len = resources.length; i < len; i++) {
        var res = rMap[resources[i]];
        if (!res.isNotReservable) {
          if (start === res.nextAvail[0]) {
            res.nextAvail = res.next(end);
          } else {
            if (!res.schedule.exceptions) res.schedule.exceptions = [];
            res.schedule.exceptions.push({
              fd_a: [ start ],
              fd_b: [ end ]
            });
            res.next = schedule.memoizedRangeFn(later.schedule(res.schedule).nextRange);
            res.nextAvail = res.next(res.nextAvail[0]);
          }
        }
      }
    }
    return {
      resourceMap: function() {
        return rMap;
      },
      setResource: function(resourceDefinition, start) {
        addResourceToMap(rMap, resourceDefinition, start);
      },
      makeReservation: function(resources, start, min, max) {
        start = start ? new Date(start) : new Date();
        return getReservation(resources, start.getTime(), min || 1, max);
      },
      moveStartDate: function(start) {
        for (var id in rMap) {
          var res = rMap[id];
          if (res.schedule.exceptions) {
            var curExceptions = res.schedule.exceptions, nextExceptions = [];
            for (var i = 0, len = curExceptions.length; i < len; i++) {
              if (!curExceptions[i].fd_b || curExceptions[i].fd_b > start) {
                nextExceptions.push(curExceptions[i]);
              }
            }
            res.schedule.exceptions = nextExceptions;
            res.next = schedule.memoizedRangeFn(later.schedule(res.schedule).nextRange);
          }
          if (res.nextAvail[0] < start) {
            res.nextAvail = res.next(start);
          }
        }
      }
    };
  };
  schedule.schedule = function(tasks, resources, sched, startDate, endDate) {
    var taskGraph = schedule.dependencyGraph(tasks), resMgr = schedule.resourceManager(resources, startDate), scheduledTasks = {};
    function generateSchedule() {
      var range, failedTasks = [], i, len;
      for (i = 0, len = taskGraph.resources.length; i < len; i++) {
        var resId = taskGraph.resources[i];
        if (!resMgr.resourceMap()[resId]) {
          resMgr.setResource({
            id: resId
          }, startDate);
        }
      }
      resMgr.setResource({
        id: "_proj",
        schedule: sched
      }, startDate);
      for (i = 0, len = tasks.length; i < len; i++) {
        var task = tasks[i];
        resMgr.setResource({
          id: "_task" + task.id,
          schedule: task.schedule
        }, startDate);
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
      for (var i = 0, len = tasks.length; i < len; i++) {
        var t = scheduledTasks[tasks[i].id];
        if (!t) {
          failedTasks.push(tasks[i].id);
          continue;
        }
        start = !start || t.earlyStart < start ? t.earlyStart : start;
        end = !end || t.earlyFinish > end ? t.earlyFinish : end;
      }
      return [ start, end ];
    }
    function forwardPass(roots) {
      var readyTasks = roots.slice(0), dependencies = {};
      while (readyTasks.length) {
        schedule.sort.tasks(taskGraph, readyTasks);
        var task = taskGraph.tasks[readyTasks.pop()], start = dependencies[task.id] ? dependencies[task.id][1] : startDate.getTime(), end = forwardPassTask(task, start);
        if (end && task.requiredBy) {
          updateDependencies(readyTasks, dependencies, task.requiredBy, end);
          resMgr.moveStartDate(getMinStart(dependencies));
        }
      }
    }
    function getMinStart(dependencies) {
      var min;
      for (var id in dependencies) {
        if (!min || min > dependencies[id][1]) {
          min = dependencies[id][1];
        }
      }
      return min;
    }
    function updateDependencies(readyTasks, dependencies, tasks, end) {
      for (var i = 0, len = tasks.length; i < len; i++) {
        var tid = tasks[i], dependsOn = taskGraph.tasks[tid].dependsOn, metDeps = dependencies[tid] || (dependencies[tid] = [ 0, 0 ]);
        metDeps[0] += 1;
        metDeps[1] = end > metDeps[1] ? end : metDeps[1];
        if (!dependsOn || metDeps[0] >= dependsOn.length) {
          readyTasks.push(tid);
        }
      }
    }
    function forwardPassTask(task, start) {
      var resAll = [ "_proj", "_task" + task.id ], resources = task.resources ? resAll.concat(task.resources) : resAll;
      duration = task.duration, next = start, scheduledTask = {
        schedule: [],
        duration: task.duration
      };
      while (duration) {
        var r = resMgr.makeReservation(resources, next, task.minSchedule || 1, duration);
        if (!r.success) return undefined;
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
      for (var i = 0, len = tasks.length; i < len; i++) {
        var sTask = scheduledTasks[tasks[i]], dependsOn = taskGraph.tasks[tasks[i]].dependsOn;
        sTask.lateFinish = finishDate;
        sTask.floatAmt = (sTask.lateFinish - sTask.earlyFinish) / later.MIN;
        if (dependsOn) {
          backwardPass(dependsOn, sTask.earlyStart);
        }
      }
    }
    return generateSchedule();
  };
  return schedule;
}();