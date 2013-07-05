var later = require('later');

schedule.resourceManager = function(resources, requiredResources, startDate) {

  var defaultSched = {schedules: {Y_a: [later.Y.val(startDate)]}},
      rMap = buildResourceMap(resources, requiredResources, startDate);

  function buildResourceMap(resArr, requiredResources, start) {
    var map = {}, i, len;

    for(i = 0, len = resArr.length; i < len; i++) {
      var res = resArr[i],
          nextFn = memoizedFn(later.schedule(res.schedule).nextRange);

      map[res.id] = {
        schedule: clone(res.schedule),
        next: nextFn,
        nextAvail: nextFn(start)
      };
    }

    for(i = 0, len = requiredResources.length; i < len; i++) {
      var reqRes = requiredResources[i];

      // a required resource was not defined, assume that it is always
      // available and add it to the map
      if(!map[reqRes]) {

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
      if(cache[start]) return cache[start];
      var result = fn(1, start);
      return (cache[start] = [result[0].getTime(), result[1].getTime()]);
    };
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function getReservation(resArr, schedNext, startTime, min, max) {
    var reservation,
        proSched = {next: schedNext, range: schedNext(startTime)},
        resSchedArr = [],
        delays = {};
        maxTries = 50;

    initRanges(resArr, proSched.range[0], resSchedArr, delays);

    while((reservation = tryReservation(resSchedArr, min, max)) && --maxTries) {
      if(reservation.success) {
        applyReservation(reservation);
        reservation.delays = delays;
        return reservation;
      }

      var start = getEarliestRange(proSched, resSchedArr, delays);
      updateRanges(proSched, resSchedArr, start);
    }

    return {success: false};
  }

  function tryReservation(resSchedArr, min,max) {
    var reservation = {success: false},
        resources = [], delays = [],
        start, end;

    for(var i = 0, len = resSchedArr.length; i < len; i++) {
      var resSched = resSchedArr[i],
          range = resSched.range;

      // if there is no next range, there can never be another reservation
      if(!range) return undefined;

      resources.push(resSched.id);
      start = !start || range[0] > start ? range[0] : start;
      end = !end || range[1] < end ? range[1] : end;
    }

    var duration = (end - start) / later.MIN;
    if(duration >= min) {
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
    if(proSched.range[1] <= startTime) {
      proSched.range = proSched.next(startTime);
    }

    updateResRanges(resSchedArr, startTime);
  }


  function updateResRanges(resSchedArr, startTime) {
    for(var i = 0, len = resSchedArr.length; i < len; i++) {
      var res = resSchedArr[i];
      if(res.range[1] <= startTime) {
        if(res.subRanges) {
          updateResRanges(res.subRanges, startTime);
          setEarliestSubRange(res);
        }
        else {
          res.range = rMap[res.id].next(startTime);
        }
      }
    }
  }

  function setEarliestSubRange(resSched) {
    var minId, minRange;

    for(var i = 0, len = resSched.subRanges.length; i < len; i++) {
      var sub = resSched.subRanges[i];

      if(!minId || sub.range[0] < minRange[0]) {
        minId = sub.id;
        minRange = sub.range;
      }
    }

    resSched.id = minId;
    resSched.range = minRange;
  }

  function getEarliestRange(proSched, resSchedArr, delays) {
    var latest = proSched.range[1];

    for(var i = 0, len = resSchedArr.length; i < len; i++) {
      var resSched = resSchedArr[i],
          start = resSched.range[0],
          end = resSched.range[1];

      latest = end < latest ? end : latest;
    }

    return latest;
  }

  function getLongestDelay(subDelays) {
    var latest, lid;
    for(var id in subDelays) {
      var available = subDelays[id].available;
      if(!latest || available < latest) {
        latest = available;
        lid = id;
      }
    }

    return lid;
  }


  function initRanges(resArr, start, ranges, delays) {

    for(var i = 0, len = resArr.length; i < len; i++) {
      var resId = resArr[i];

      if(Array.isArray(resId)) {
        var subRanges = [], subDelays = {};
        initRanges(resId, start, subRanges, subDelays);

        var longDelay = getLongestDelay(subDelays);
        delays[longDelay] = subDelays[longDelay];

        var resSched = {subRanges: subRanges};
        setEarliestSubRange(resSched);
        ranges.push(resSched);
      }
      else {
        var res = rMap[resId],
            range = res.nextAvail[1] >= start ? res.nextAvail : res.next(start);

        if(range[0] > start) {
          delays[resId] = {
            needed: new Date(start),
            available: new Date(range[0])
          };
        }

        ranges.push({id: resId, range: range});
      }
    }
  }

  function applyReservation(reservation) {
    var start = reservation.start,
        end = reservation.start + (reservation.duration * later.MIN);

    for(var i = 0, len = reservation.resources.length; i < len; i++) {
      var res = rMap[reservation.resources[i]];

      if(start === res.nextAvail[0]) {
        res.nextAvail = res.next(end);
      }
      else {
        if(!res.schedule.exceptions) res.schedule.exceptions = [];
        res.schedule.exceptions.push({fd_a: [start], fd_b: [end] });
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
      if(!d || !d.getTime()) throw new Error('Invalid start date.');

      return getReservation(resArr, schedNext, start.getTime(), min || 1, max);
    },

    moveStartDate: function(start) {
      var startTime = start.getTime();

      for(var id in rMap) {
        var res = rMap[id];

        if(res.schedule.exceptions) {
          var curExceptions = res.schedule.exceptions,
              nextExceptions = [];

          for(var i = 0, len = curExceptions.length; i < len; i++) {
            if(!curExceptions[i].fd_b || curExceptions[i].fd_b > startTime) {
              nextExceptions.push(curExceptions[i]);
            }
          }

          res.schedule.exceptions = nextExceptions;
          res.next = memoizedFn(later.schedule(res.schedule).nextRange);
        }

        if(res.nextAvail[0] < startTime) {
          res.nextAvail = res.next(start);
        }
      }
    }
  };

};