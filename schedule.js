schedule = function() {
  var schedule = {
    version: "1.0.0"
  };
  schedule.functor = function(v) {
    return typeof v === "function" ? v : function() {
      return v;
    };
  };
  var later = require("later");
  later.date.localTime();
  schedule.tree = function(taskItems) {
    var tMap = buildTaskMap(taskItems), roots = [], leaves = [], maxDepth = 0;
    var schedule = later.schedule({
      schedules: [ {
        dw: [ 2, 3, 4, 5, 6 ],
        h_a: [ 8 ],
        h_b: [ 16 ]
      } ]
    }), nextRange = memNextRange(schedule), prevRange = memPrevRange(schedule);
    findRequiredBy(tMap);
    findRootsAndLeaves(tMap, roots, leaves);
    forwardPass(tMap, roots, nextRange, nextRange(new Date(2013, 2, 21)));
    var end = findEndDate(tMap, leaves);
    backwardPass(tMap, leaves, prevRange, prevRange(end));
    if (roots.length === 0) throw new Error("At least one task must not depend on any others.");
    function findEndDate(map, nodes) {
      var end;
      for (var i = 0, len = nodes.length; i < len; i++) {
        var node = map[nodes[i]];
        if (!end || node.optimial.earlyFinish > end) {
          end = node.optimal.earlyFinish;
        }
      }
      return end;
    }
    function buildTaskMap(items) {
      var map = {};
      for (var i = 0, len = items.length; i < len; i++) {
        map[items[i].id] = items[i];
      }
      return map;
    }
    function findRequiredBy(map) {
      for (var id in map) {
        var child = map[id], dependsOn = child.dependsOn;
        child.optimal = {};
        if (!dependsOn) continue;
        for (var i = 0, len = dependsOn.length; i < len; i++) {
          var parent = map[dependsOn[i]];
          (parent.requiredBy || (parent.requiredBy = [])).push(child.id);
        }
      }
    }
    function findRootsAndLeaves(map, roots, leaves) {
      for (var id in map) {
        var node = map[id];
        if (!node.dependsOn || node.dependsOn.length === 0) {
          roots.push(node.id);
        } else if (!node.requiredBy || node.requiredBy.length === 0) {
          leaves.push(node.id);
        }
      }
    }
    function forwardPass(map, nodes, nextRange, startRange) {
      for (var i = 0, len = nodes.length; i < len; i++) {
        var node = map[nodes[i]], endRange = forwardPassNode(node, nextRange, startRange);
        if (endRange && node.requiredBy) {
          forwardPass(map, node.requiredBy, nextRange, endRange);
        }
      }
    }
    function forwardPassNode(node, nextRange, startRange) {
      (node.dependencyStarts || (node.dependencyStarts = [])).push(startRange);
      if (node.dependsOn && node.dependsOn.length > node.dependencyStarts.length) return undefined;
      startRange = findMaxRange(node.dependencyStarts);
      startRange = startRange[0].getTime() === startRange[1].getTime() ? nextRange(startRange[0]) : startRange;
      node.optimal.earlyStart = startRange[0];
      var timeLeft = (startRange[1].getTime() - startRange[0].getTime()) / later.MIN, duration = node.duration;
      while (duration > timeLeft) {
        duration -= timeLeft;
        startRange = nextRange(startRange[1]);
        timeLeft = (startRange[1].getTime() - startRange[0].getTime()) / later.MIN;
      }
      node.optimal.earlyFinish = new Date(startRange[0].getTime() + duration * later.MIN);
      return [ node.optimal.earlyFinish, startRange[1] ];
    }
    function backwardPass(map, nodes, prevRange, startRange, depth) {
      for (var i = 0, len = nodes.length; i < len; i++) {
        var node = map[nodes[i]], endRange = backwardPassNode(node, prevRange, startRange);
        if (!node.maxDepth || node.maxDepth < depth) {
          node.maxDepth = depth || 0;
          maxDepth = depth > maxDepth ? depth : maxDepth;
        }
        if (endRange && node.dependsOn) {
          backwardPass(map, node.dependsOn, prevRange, endRange, (depth || 0) + 1);
        }
      }
    }
    function backwardPassNode(node, prevRange, startRange) {
      (node.requiredByEnds || (node.requiredByEnds = [])).push(startRange);
      if (node.requiredBy && node.requiredBy.length > node.requiredByEnds.length) return undefined;
      startRange = findMinRange(node.requiredByEnds);
      startRange = startRange[0].getTime() === startRange[1].getTime() ? prevRange(startRange[1].getTime() - later.SEC) : startRange;
      node.optimal.lateFinish = startRange[1];
      var timeLeft = (startRange[1].getTime() - startRange[0].getTime()) / later.MIN, duration = node.duration;
      while (duration > timeLeft) {
        duration -= timeLeft;
        startRange = prevRange(startRange[0].getTime() - later.SEC);
        timeLeft = (startRange[1].getTime() - startRange[0].getTime()) / later.MIN;
      }
      node.optimal.lateStart = new Date(startRange[1].getTime() - duration * later.MIN);
      node.optimal.floatDays = calcFloat(new Date(node.optimal.earlyStart), new Date(node.optimal.lateStart));
      return [ startRange[0], node.optimal.lateStart ];
    }
    function calcFloat(start, end) {
      if (later.D.val(start) === later.D.val(end)) {
        return (later.h.val(end) - later.h.val(start)) / 24;
      }
      return (later.D.start(end).getTime() - later.D.start(start).getTime()) / later.DAY;
    }
    function findMaxRange(arr) {
      var max = arr[0];
      for (var i = 1, len = arr.length; i < len; i++) {
        if (arr[i][0] > max[0]) {
          max = arr[i];
        }
      }
      return max;
    }
    function findMinRange(arr) {
      var min = arr[0];
      for (var i = 1, len = arr.length; i < len; i++) {
        if (arr[i][1] < min[1]) {
          min = arr[i];
        }
      }
      return min;
    }
    function memNextRange(schedule) {
      var cache = {};
      return function(start) {
        return cache[start] || (cache[start] = schedule.nextRange(1, start));
      };
    }
    function memPrevRange(schedule) {
      var cache = {};
      return function(start) {
        return cache[start] || (cache[start] = schedule.prevRange(1, start));
      };
    }
    function calcCriticalPath(map, nodes, path) {
      for (var i = 0, len = nodes.length; i < len; i++) {
        var node = map[nodes[i]];
        if (node.optimal.floatDays === 0) {
          path.push(node.id);
          if (node.requiredBy) {
            calcCriticalPath(map, node.requiredBy, path);
          }
          break;
        }
      }
    }
    return {
      roots: function() {
        return roots;
      },
      leaves: function() {
        return leaves;
      },
      depth: function() {
        return maxDepth;
      },
      items: function() {
        return tMap;
      },
      criticalPath: function() {
        var path = [];
        calcCriticalPath(tMap, roots, path);
        return path;
      }
    };
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
  return schedule;
}();