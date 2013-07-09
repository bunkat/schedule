/**
* Resource manager
* (c) 2013 Bill, BunKat LLC.
*
* Manages all of the resources and schedule constraints (project schedule,
* task schedule, and resource schedules) and reserves resources as needed. Finds
* the earliest time that a set of resources can be reserved.
*
* Schedule is freely distributable under the MIT license.
* For all details and documentation:
*     http://github.com/bunkat/schedule
*/

schedule.resourceManager = function(resourceDefinitions, startDate) {

  var defaultSched = {schedules: [{fd_a: [startDate.getTime()]}]},
      rMap = buildResourceMap(resourceDefinitions, startDate);

  /**
  * Creates a map from the resource definitions that contains the schedule
  * information for each of the resources (specifically when the resource
  * will be next available and how to calculate future availability).
  */
  function buildResourceMap(resourceDefinitions, start) {
    var map = {};
    if(resourceDefinitions) {
      for(var i = 0, len = resourceDefinitions.length; i < len; i++) {
        addResourceToMap(map, resourceDefinitions[i], start);
      }
    }

    return map;
  }

  /**
  * Adds a resource to the resource map.
  */
  function addResourceToMap(map, def, start) {
    var sched = JSON.parse(JSON.stringify(def.available || defaultSched)),
        nextFn = schedule.memoizedRangeFn(later.schedule(sched).nextRange);

    map[def.id] = { schedule: sched, next: nextFn, nextAvail: nextFn(start) };
  }

  /**
  * Attempts to find the next time that all resources are available, starting
  * from the start time, with a duration of at least min minutes but no more
  * than max minutes.
  */
  function getReservation(resources, start, min, max) {
    var reservation, schedules = [], delays = {},
        maxTries = 50;

    initRanges(resources, start, schedules, delays);
    while(!(reservation = tryReservation(schedules, min, max)).success && --maxTries) {
      updateRanges(schedules, nextValidStart(schedules), delays);
    }

    reservation.delays = delays;
    return reservation;
  }

  /**
  * Initializes the resource schedule availablity based on the start date
  * provided. Resources that were not immediately available are captured in
  * the delays array to be reported with the reservation.
  */
  function initRanges(resources, start, ranges, delays) {
    for(var i = 0, len = resources.length; i < len; i++) {
      var resId = resources[i];

      // handles nested resources (OR)
      if(Array.isArray(resId)) {
        var subRanges = [], subDelays = {};
        initRanges(resId, start, subRanges, subDelays);

        var longDelay = getLongestDelay(subDelays);
        if(longDelay) {
          delays[longDelay] = subDelays[longDelay];
        }

        var schedule = {subRanges: subRanges};
        setEarliestSubRange(schedule);
        ranges.push(schedule);
      }
      else {
        var res = rMap[resId],
            range = res.nextAvail[0] >= start ? res.nextAvail :
                    res.next(start);

        if(range[0] > start && resId !== '_proj') {
          delays[resId] = { needed: start, available: range[0] };
        }

        ranges.push({id: resId, range: range});
      }
    }
  }

  /**
  * Determines if the current schedules overlap for at least min minutes. If
  * they do, a reservation is created, otherwise a failure is reported.
  */
  function tryReservation(schedules, min,max) {
    var reservation = {success: false},
        resources = [], start, end;

    for(var i = 0, len = schedules.length; i < len; i++) {
      var schedule = schedules[i],
          range = schedule.range;

      if(!isInternal(schedule)) {
        resources.push(schedule.id);
      }

      start = !start || range[0] > start ? range[0] : start;
      end = !end || range[1] < end ? range[1] : end;
    }

    var duration = (end - start) / later.MIN;
    if(duration >= min || duration >= max) {
      duration = max && duration > max ? max : duration;
      reservation = createReservation(resources, start, duration);
    }

    return reservation;
  }

  /**
  * Generates a new reservation object and reserves the associated resources.
  */
  function createReservation(resources, start, duration) {
    var end = start + (duration * later.MIN),
        reservation = {
          resources: resources,
          start: start,
          end: end,
          duration: duration,
          success: true
        };

    applyReservation(resources, start, end);
    return reservation;
  }

  /**
  * Updates ranges after a failed reservation attempt. Resources that were not
  * immediately available are captured in the delays array to be reported with
  * the reservation.
  */
  function updateRanges(resources, start, delays) {
    for(var i = 0, len = resources.length; i < len; i++) {
      var res = resources[i];
      if(res.range[1] > start) continue;

      if(res.subRanges) {
        updateRanges(res.subRanges, start, {});
        setEarliestSubRange(res);
      }
      else {
        res.range = rMap[res.id].next(start);

        if(res.id !== '_proj' && !delays[res.id]) {
          delays[res.id] = { needed: start, available: res.range[0] };
        }
      }
    }
  }

  /**
  * Applies a schedule reservation (by adding schedule exceptions) to any
  * reservable resources that are indicated.
  */
  function applyReservation(resources, start, end) {
    for(var i = 0, len = resources.length; i < len; i++) {
      var res = rMap[resources[i]];

      // skip if this resource should not be reserved for single use
      if(res.isNotReservable) continue;

      if(start !== res.nextAvail[0]) {
        if(!res.schedule.exceptions) res.schedule.exceptions = [];
        res.schedule.exceptions.push({fd_a: [start], fd_b: [end] });
        res.next = schedule.memoizedRangeFn(later.schedule(res.schedule).nextRange);
        end = res.nextAvail[0];
      }

      res.nextAvail = res.next(end);
    }
  }

  /**
  * Determines the earliest time that a schedule goes invalid which is the
  * time that should be used to update resource ranges from.
  */
  function nextValidStart(schedules) {
    var latest;
    for(var i = 0, len = schedules.length; i < len; i++) {
      var end = schedules[i].range[1];
      latest = !latest || end < latest ? end : latest;
    }

    return latest;
  }

  /**
  * Resources that are OR'd together (using a nested array) are treated as a
  * single resource with sub resources. This function determines the resource
  * that has the earliest start date which is then used for future calculations.
  */
  function setEarliestSubRange(schedule) {
    var minId, minRange;
    for(var i = 0, len = schedule.subRanges.length; i < len; i++) {
      var sub = schedule.subRanges[i];

      if(!minId || (sub.range[0] < minRange[0])) {
        minId = sub.id;
        minRange = sub.range;
      }
    }

    schedule.id = minId;
    schedule.range = minRange;
  }

  /**
  * Determines the longest delay amongst a set of delays. Used to determine
  * which resource to report for resources that are OR'd together.
  */
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

  /**
  * Returns true if resource provided is an internal (not user specified)
  * resource.
  */
  function isInternal(resource) {
    return resource.id[0] === '_';
  }

  return {

    /**
    * Returns the current resource schedule state for the specified resoruce id.
    */
    getResource: function(id) {
      return rMap[id];
    },

    /**
    * Adds a new resource to the resource map if a resource doesn't already exist
    * with that id. Expects resources to be passed in as an array and will
    * prefix each resource with the prefix specified.
    */
    addResource: function(arr, prefix, start) {
      for(var i = 0, len = arr.length; i < len; i++) {
        var def = typeof arr[i] !== 'object' ?
          { id: prefix + arr[i] } :
          { id: prefix + arr[i].id, available: arr[i].available, isNotReservable: arr[i].isNotReservable };

        if(!rMap[def.id]) {
          addResourceToMap(rMap, def, start);
        }
      }
    },

    /**
    * Attempts to reserve the set of resources at the earliest possible time from
    * start time provide with a duration of at least min and no more than max
    * minutes.
    */
    makeReservation: function(resources, start, min, max) {
      start = start ? new Date(start) : new Date();
      return getReservation(resources, start.getTime(), min || 1, max);
    },

    /**
    * Optimizes the resource schedules by eliminating schedule reservations that
    * occur before the start date provided (i.e. ones that can never occur
    * again).
    */
    optimize: function(start) {
      for(var id in rMap) {
        var res = rMap[id];

        if(res.schedule.exceptions) {
          var curExceptions = res.schedule.exceptions;
          res.schedule.exceptions = [];

          for(var i = 0, len = curExceptions.length; i < len; i++) {
            if(!curExceptions[i].fd_b || curExceptions[i].fd_b > start) {
              res.schedule.exceptions.push(curExceptions[i]);
            }
          }
          res.next = schedule.memoizedRangeFn(later.schedule(res.schedule).nextRange);
        }

        if(res.nextAvail[0] < start) {
          res.nextAvail = res.next(start);
        }
      }
    }
  };

};