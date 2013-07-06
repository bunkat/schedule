
schedule.resourceManager = function(resourceDefinitions, startDate) {

  var defaultSched = {schedules: [{fd_a: [startDate.getTime()]}]},
      rMap = buildResourceMap(resourceDefinitions, startDate);

  function buildResourceMap(resourceDefinitions, start) {
    var map = {}, i, len;

    if(resourceDefinitions) {
      for(i = 0, len = resourceDefinitions.length; i < len; i++) {
        addResourceToMap(map, resourceDefinitions[i], start);
      }
    }

    return map;
  }


  function addResourceToMap(map, def, start) {
    var sched = JSON.parse(JSON.stringify(def.schedule || defaultSched)),
        nextFn = schedule.memoizedRangeFn(later.schedule(sched).nextRange);

    map[def.id] = { schedule: sched, next: nextFn, nextAvail: nextFn(start) };
  }


  function getReservation(resources, start, min, max) {
    var reservation,
        schedules = [],
        delays = {};
        maxTries = 50;

    initRanges(resources, start, schedules, delays);

    while(!(reservation = tryReservation(schedules, min, max)).success && --maxTries) {
      updateRanges(schedules, nextValidStart(schedules), delays);
      reservation.delays = delays;
    }

    return reservation;
  }

  function tryReservation(schedules, min,max) {
    var reservation = {success: false},
        resources = [],
        start, end;

    for(var i = 0, len = schedules.length; i < len; i++) {
      var schedule = schedules[i],
          range = schedule.range;

      // if there is no next range, there can never be another reservation
      if(!range) return {success: false};

      if(schedule.id[0] !== '_') { // ids that start with _ are internal
        resources.push(schedule.id);
      }

      start = !start || range[0] > start ? range[0] : start;
      end = !end || range[1] < end ? range[1] : end;
    }

    var duration = (end - start) / later.MIN;
    if(duration >= min) {
      duration = max && duration > max ? max : duration;
      end = start + (duration * later.MIN);
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
    for(var i = 0, len = resources.length; i < len; i++) {
      var res = resources[i];
      if(res.range[1] <= start) {
        if(res.subRanges) {
          updateRanges(res.subRanges, start, {});
          setEarliestSubRange(res);
        }
        else {
          res.range = rMap[res.id].next(start);

          if(res.id !== '_proj' && !delays[res.id]) {
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

    for(var i = 0, len = schedule.subRanges.length; i < len; i++) {
      var sub = schedule.subRanges[i];

      if(!minId || sub.range[0] < minRange[0]) {
        minId = sub.id;
        minRange = sub.range;
      }
    }

    schedule.id = minId;
    schedule.range = minRange;
  }

  function nextValidStart(schedules) {
    var latest;

    for(var i = 0, len = schedules.length; i < len; i++) {
      var end = schedules[i].range[1];
      latest = !latest || end < latest ? end : latest;
    }

    return latest;
  }

  function getLongestDelay(delays) {
    var latest, lid;
    for(var id in delays) {
      var available = delays[id].available;
      if(!latest || available < latest) {
        latest = available;
        lid = id;
      }
    }

    return lid;
  }


  function initRanges(resources, start, ranges, delays) {

    for(var i = 0, len = resources.length; i < len; i++) {
      var resId = resources[i];

      if(Array.isArray(resId)) {
        var subRanges = [], subDelays = {};
        initRanges(resId, start, subRanges, subDelays);

        var longDelay = getLongestDelay(subDelays);
        delays[longDelay] = subDelays[longDelay];

        var schedule = {subRanges: subRanges};
        setEarliestSubRange(schedule);
        ranges.push(schedule);
      }
      else {
        var res = rMap[resId],
            range = res.nextAvail[0] >= start ? res.nextAvail :
                    res.next(start);

        if(range[0] > start && resId !== '_proj') {
          delays[resId] = {
            needed: new Date(start),
            available: new Date(range[0])
          };
        }

        ranges.push({id: resId, range: range});
      }
    }
  }

  function applyReservation(resources, start, end) {
    for(var i = 0, len = resources.length; i < len; i++) {
      var res = rMap[resources[i]];
      if(!res.isNotReservable) { // only need to reserve resources that are reservable

        if(start === res.nextAvail[0]) {
          res.nextAvail = res.next(end);
        }
        else {
          if(!res.schedule.exceptions) res.schedule.exceptions = [];
          res.schedule.exceptions.push({fd_a: [start], fd_b: [end] });
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
      for(var id in rMap) {
        var res = rMap[id];

        if(res.schedule.exceptions) {
          var curExceptions = res.schedule.exceptions,
              nextExceptions = [];

          for(var i = 0, len = curExceptions.length; i < len; i++) {
            if(!curExceptions[i].fd_b || curExceptions[i].fd_b > start) {
              nextExceptions.push(curExceptions[i]);
            }
          }

          res.schedule.exceptions = nextExceptions;
          res.next = schedule.memoizedRangeFn(later.schedule(res.schedule).nextRange);
        }

        if(res.nextAvail[0] < start) {
          res.nextAvail = res.next(start);
        }
      }
    }
  };

};