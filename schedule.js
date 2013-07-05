schedule = function() {
  var schedule = {
    version: "1.0.0"
  };
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
        cache[start] = [ result[0].getTime(), result[1].getTime() ];
      }
      return cache[start];
    };
  };
  schedule.sort = {};
  schedule.sort.tasks = function(taskGraph, readyTasks) {
    readyTasks.sort(function(a, b) {
      return taskGraph.tasks[b].floatAmt > taskGraph.tasks[a].floatAmt;
    });
  };
  schedule.resources = function(resourceArr) {
    var id = resourcesId, sched = resourcesSched;
    function resources() {
      var map = {}, fid = schedule.functor(id), fsched = schedule.functor(sched);
      for (var i = 0, len = resourceArr.length; i < len; i++) {
        var resource = resourceArr[i], rId = fid.call(this, resource, i), rSched = fsched.call(this, resource, i);
        map[rId] = {
          id: rId,
          schedule: rSched
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
    return resources;
  };
  function resourcesId(d) {
    return d.id;
  }
  function resourcesSched(d) {
    return d.schedule;
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
  var later = require("later");
  schedule.resourceManager = function(resources, requiredResources, startDate) {
    var defaultSched = {
      schedules: {
        Y_a: [ later.Y.val(startDate) ]
      }
    }, rMap = buildResourceMap(resources, requiredResources, startDate);
    function buildResourceMap(resArr, requiredResources, start) {
      var map = {}, i, len;
      for (i = 0, len = resArr.length; i < len; i++) {
        var res = resArr[i], nextFn = memoizedFn(later.schedule(res.schedule).nextRange);
        map[res.id] = {
          schedule: clone(res.schedule),
          next: nextFn,
          nextAvail: nextFn(start)
        };
      }
      for (i = 0, len = requiredResources.length; i < len; i++) {
        var reqRes = requiredResources[i];
        if (!map[reqRes]) {
          map[reqRes] = {
            schedule: defaultSched,
            next: memoizedFn(later.schedule(defaultSched).nextRange),
            nextAvail: start
          };
        }
      }
      return map;
    }
    function memoizedFn(fn) {
      var cache = {};
      return function(start) {
        if (cache[start]) return cache[start];
        var result = fn(1, start);
        return cache[start] = [ result[0].getTime(), result[1].getTime() ];
      };
    }
    function clone(obj) {
      return JSON.parse(JSON.stringify(obj));
    }
    function getReservation(resArr, schedNext, startTime, min, max) {
      var reservation, proSched = {
        next: schedNext,
        range: schedNext(startTime)
      }, resSchedArr = [], delays = {};
      maxTries = 50;
      initRanges(resArr, proSched.range[0], resSchedArr, delays);
      while ((reservation = tryReservation(resSchedArr, min, max)) && --maxTries) {
        if (reservation.success) {
          applyReservation(reservation);
          reservation.delays = delays;
          return reservation;
        }
        var start = getEarliestRange(proSched, resSchedArr, delays);
        updateRanges(proSched, resSchedArr, start);
      }
      return {
        success: false
      };
    }
    function tryReservation(resSchedArr, min, max) {
      var reservation = {
        success: false
      }, resources = [], delays = [], start, end;
      for (var i = 0, len = resSchedArr.length; i < len; i++) {
        var resSched = resSchedArr[i], range = resSched.range;
        if (!range) return undefined;
        resources.push(resSched.id);
        start = !start || range[0] > start ? range[0] : start;
        end = !end || range[1] < end ? range[1] : end;
      }
      var duration = (end - start) / later.MIN;
      if (duration >= min) {
        reservation = {
          resources: resources,
          start: start,
          duration: max && duration > max ? max : duration,
          delays: delays,
          success: true
        };
      }
      return reservation;
    }
    function updateRanges(proSched, resSchedArr, startTime) {
      if (proSched.range[1] <= startTime) {
        proSched.range = proSched.next(startTime);
      }
      updateResRanges(resSchedArr, startTime);
    }
    function updateResRanges(resSchedArr, startTime) {
      for (var i = 0, len = resSchedArr.length; i < len; i++) {
        var res = resSchedArr[i];
        if (res.range[1] <= startTime) {
          if (res.subRanges) {
            updateResRanges(res.subRanges, startTime);
            setEarliestSubRange(res);
          } else {
            res.range = rMap[res.id].next(startTime);
          }
        }
      }
    }
    function setEarliestSubRange(resSched) {
      var minId, minRange;
      for (var i = 0, len = resSched.subRanges.length; i < len; i++) {
        var sub = resSched.subRanges[i];
        if (!minId || sub.range[0] < minRange[0]) {
          minId = sub.id;
          minRange = sub.range;
        }
      }
      resSched.id = minId;
      resSched.range = minRange;
    }
    function getEarliestRange(proSched, resSchedArr, delays) {
      var latest = proSched.range[1];
      for (var i = 0, len = resSchedArr.length; i < len; i++) {
        var resSched = resSchedArr[i], start = resSched.range[0], end = resSched.range[1];
        latest = end < latest ? end : latest;
      }
      return latest;
    }
    function getLongestDelay(subDelays) {
      var latest, lid;
      for (var id in subDelays) {
        var available = subDelays[id].available;
        if (!latest || available < latest) {
          latest = available;
          lid = id;
        }
      }
      return lid;
    }
    function initRanges(resArr, start, ranges, delays) {
      for (var i = 0, len = resArr.length; i < len; i++) {
        var resId = resArr[i];
        if (Array.isArray(resId)) {
          var subRanges = [], subDelays = {};
          initRanges(resId, start, subRanges, subDelays);
          var longDelay = getLongestDelay(subDelays);
          delays[longDelay] = subDelays[longDelay];
          var resSched = {
            subRanges: subRanges
          };
          setEarliestSubRange(resSched);
          ranges.push(resSched);
        } else {
          var res = rMap[resId], range = res.nextAvail[1] >= start ? res.nextAvail : res.next(start);
          if (range[0] > start) {
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
    function applyReservation(reservation) {
      var start = reservation.start, end = reservation.start + reservation.duration * later.MIN;
      for (var i = 0, len = reservation.resources.length; i < len; i++) {
        var res = rMap[reservation.resources[i]];
        if (start === res.nextAvail[0]) {
          res.nextAvail = res.next(end);
        } else {
          if (!res.schedule.exceptions) res.schedule.exceptions = [];
          res.schedule.exceptions.push({
            fd_a: [ start ],
            fd_b: [ end ]
          });
          res.next = memoizedFn(later.schedule(res.schedule).nextRange);
        }
      }
    }
    return {
      resourceMap: function() {
        return rMap;
      },
      makeReservation: function(resArr, schedNext, start, min, max) {
        var d = start ? new Date(start) : new Date();
        if (!d || !d.getTime()) throw new Error("Invalid start date.");
        return getReservation(resArr, schedNext, start.getTime(), min || 1, max);
      },
      moveStartDate: function(start) {
        var startTime = start.getTime();
        for (var id in rMap) {
          var res = rMap[id];
          if (res.schedule.exceptions) {
            var curExceptions = res.schedule.exceptions, nextExceptions = [];
            for (var i = 0, len = curExceptions.length; i < len; i++) {
              if (!curExceptions[i].fd_b || curExceptions[i].fd_b > startTime) {
                nextExceptions.push(curExceptions[i]);
              }
            }
            res.schedule.exceptions = nextExceptions;
            res.next = memoizedFn(later.schedule(res.schedule).nextRange);
          }
          if (res.nextAvail[0] < startTime) {
            res.nextAvail = res.next(start);
          }
        }
      }
    };
  };
  schedule.schedule = function(tasks, resources, sched, startDate, endDate) {
    var taskGraph = schedule.dependencyGraph(tasks), resMgr = schedule.resourceManager(resources, taskGraph.resources, startDate), schedNext = schedule.memoizedRangeFn(later.schedule(sched).nextRange), scheduledTasks = {};
    function generateSchedule() {
      var end, failedTasks = [];
      forwardPass(taskGraph.roots, schedNext(startDate));
      end = getEnd(taskGraph.leaves);
      backwardPass(taskGraph.leaves, end);
      for (var i = 0, len = tasks.length; i < len; i++) {
        if (!scheduledTasks[tasks[i].id]) {
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
      for (var i = 0, len = taskIds.length; i < len; i++) {
        var sTask = scheduledTasks[taskIds[i]];
        if (!end || sTask.earlyFinish > end) {
          end = sTask.earlyFinish;
        }
      }
      return end;
    }
    function forwardPass(roots, startRange) {
      var readyTasks = [], dependencies = {};
      updateDependencies(readyTasks, dependencies, roots, startRange);
      while (readyTasks.length) {
        schedule.sort.tasks(taskGraph, readyTasks);
        var task = taskGraph.tasks[readyTasks.pop()], endRange = forwardPassTask(task, dependencies[task.id][1]);
        if (task.requiredBy) {
          updateDependencies(readyTasks, dependencies, task.requiredBy, endRange);
        }
      }
    }
    function updateDependencies(readyTasks, dependencies, tasks, dateRange) {
      if (dateRange[0] === dateRange[1]) {
        dateRange = schedNext(dateRange[1]);
      }
      for (var i = 0, len = tasks.length; i < len; i++) {
        var tid = tasks[i], task = taskGraph.tasks[tid], reqDepCount = task.dependsOn ? task.dependsOn.length : 0, metDeps = dependencies[tid];
        if (metDeps) {
          metDeps[0] += 1;
          metDeps[1] = dateRange[0] > metDeps[1][0] ? dateRange : metDeps[1];
        } else {
          dependencies[tid] = [ 1, dateRange ];
        }
        if (dependencies[tid][0] >= reqDepCount) {
          readyTasks.push(tid);
        }
      }
    }
    function forwardPassTask(task, startRange) {
      var duration = task.duration, start, end, timeLeft, taskEnd, scheduledTask = {
        schedule: [],
        duration: task.duration
      };
      scheduledTask.earlyStart = startRange[0];
      while (duration > 0) {
        start = startRange[0];
        end = startRange[1];
        timeLeft = (end - start) / later.MIN;
        taskEnd = timeLeft > duration ? start + duration * later.MIN : end;
        duration -= timeLeft;
        scheduledTask.schedule.push({
          start: start,
          end: taskEnd,
          duration: (taskEnd - start) / later.MIN
        });
        if (duration > 0) {
          startRange = schedNext(end);
        }
      }
      scheduledTask.earlyFinish = taskEnd;
      scheduledTasks[task.id] = scheduledTask;
      return [ taskEnd, end ];
    }
    function backwardPass(tasks, finishDate) {
      for (var i = 0, len = tasks.length; i < len; i++) {
        var task = taskGraph.tasks[tasks[i]], sTask = scheduledTasks[tasks[i]];
        sTask.lateFinish = finishDate;
        sTask.floatAmt = (sTask.lateFinish - sTask.earlyFinish) / later.MIN;
        if (task.dependsOn) {
          backwardPass(task.dependsOn, sTask.earlyStart);
        }
      }
    }
    return generateSchedule();
  };
  return schedule;
}();