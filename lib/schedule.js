/**
* Schedule.js
* (c) 2013 Bill, BunKat LLC.
* Schedule is freely distributable under the MIT license.
* For all details and documentation:
*     http://bunkat.github.com/schedule
*/

if (!later && (typeof require !== 'undefined')) {
  var later = require('later').later,
      recur = require('later').recur;
}

(function() {

  "use strict";

  /**
  * Automatically schedules human work (tasks) as part of a project. Schedule
  * takes into account working hours, holidays/days off, people's work
  * schedule/vacation time, as well as task dependencies. Schedule produces
  * stable schedules and optimizes for shortest total schedule length.
  *
  */

  /**
  * Initializes the Schedule object.
  *
  * @param {Int} resolution: Minimum task length in minutes
  * @param {Date} startTime: The date/time to start scheduling tasks
  * @param {Bool} useLocalTime: True if local time zone should be used
  * @api public
  */
  var Schedule = function(resolution, startTime, useLocalTime) {
    // constants
    var SEC = 1000,
        MIN = SEC * 60,
        MAX = (new Date(2050,0,1)).getTime();

    resolution = resolution || 30;
    startTime = startTime ? new Date(startTime) : new Date();

    // configuration
    var project = { schedules: [] },
        people = {},
        tasks = [],
        l = later(resolution * MIN, useLocalTime);


    var diff = function (start, end) {
      return (end - start) / MIN;
    };


    var scheduleTask = function(task, time, completeCache, scheduledTasks) {
      var assignedTo = task.assignedTo,
          dependsOn = task.dependsOn,
          earliest = task.earliestStartTime,
          tLength = task.remainingMin === undefined ? task.estimatedTime : task.remainingMin,
          sLength = Math.min(tLength, project.rangeLength);

      if(tLength === 0) {
        return 0;
      }

      // make sure we are at the earliest start time
      if(earliest && earliest.getTime() > time) {
        return earliest.getTime();
      }

      // make sure any dependencies have been completed
      if(dependsOn) {
        for(var i = 0, len = dependsOn.length; i < len; i++) {
          var cTime = completeCache[dependsOn[i]];
          if(!cTime) {
            return time + resolution * MIN;
          }
          else if(time < cTime) {
            return cTime;
          }

        }
      }

      // make sure that assignedTo is available
      if(assignedTo !== undefined) {
        var p = people[assignedTo];
        if(p.rangeStartTime <= time) {
          sLength = Math.min(sLength, diff(time, p.rangeEndTime));
          p.rangeStartTime = time + (sLength * MIN);
          p.rangeLength = diff(p.rangeStartTime, p.rangeEndTime);
        }
        else {
          return p.rangeStartTime;
        }
      }

      task.remainingMin = tLength - sLength;
      scheduledTasks.push({
        id: task.id,
        startTime: new Date(time),
        endTime: new Date(time + sLength * MIN),
        length: sLength
      });

      if(task.remainingMin <= 0) {
        completeCache[task.id] = time + sLength * MIN;
        return 0;
      }

      return time + resolution * MIN;
    };

    var updateRange = function(s, time) {
      var t = new Date(time), start, end;

      start = l.getNext(s, t);
      s.rangeStartTime = start ? start.getTime() : undefined;

      if(start) {
        end = l.getNextInvalid(s, start);
        s.rangeEndTime = end ? end.getTime() : MAX;
        s.rangeLength = diff(s.rangeStartTime, s.rangeEndTime);
      }
      else {
        s.rangeEndTime = undefined;
        s.rangeLength = 0;
      }
    };


    var scheduleTasks = function(tasks) {

      var scheduledTasks = [],
          completeCache = {},
          time, next, tNext, id, done = false;

      // calculate first valid project range
      updateRange(project, startTime);
      time = project.rangeStartTime;

      // calculate first available ranges for people
      for(id in people) {
        updateRange(people[id], time);
      }

      var count = 0;
      while(!done && time) {
        done = true;
        next = null;

        // schedule as many tasks as possible
        for(var i = 0, len = tasks.length; i < len; i++) {
          tNext = scheduleTask(tasks[i], time, completeCache, scheduledTasks);
          if(tNext) { // next will be 0 if task was completely scheduled
            if(!next || tNext < next) next = tNext;
            done = false;
          }
        }

        if(!next) break;

        // move to the next increment
        time = next;

        // update project
        if(time >= project.rangeEndTime) {
          updateRange(project, time);
          time = project.rangeStartTime;
        }

        // update people
        for(id in people) {
          if(time >= people[id].rangeEndTime) {
            updateRange(people[id], time);
          }
        }

        count++;
      }

      console.log(count);
      return scheduledTasks;
    };


    return {

      /**
      * Configures details about the project that is being scheduled.
      *
      * @param {Obj} options: Project options including schedule
      * @api public
      */
      project: function (_) {
        if(arguments.length === 0) return project;
        project = _;
        return this;
      },

      /**
      * Configures details about the people that tasks are assigned to.
      *
      * @param {Obj} options: People options including schedule
      * @api public
      */
      people: function (_) {
        if(arguments.length === 0) return people;
        people = _;
        return this;
      },

      /**
      * The tasks that will be scheduled.
      *
      * Returns a set of schedule items that defines the start date of the
      * task.
      *
      * @param {Array} arrTasks: Array of tasks to include in the schedule.
      * @api public
      */
      tasks: function (arrTasks) {
        var i, len;

        // make sure all people are accounted for
        for(i = 0, len = arrTasks.length; i < len; i++) {
          var person = arrTasks[i].assignedTo;
          if(!people[person]) {
            people[person] = {};
          }
        }

        return scheduleTasks(arrTasks);
      }

    };
  };

  /**
  * Allow library to be used within both the browser and node.js
  */
  var root = typeof exports !== "undefined" && exports !== null ? exports : window;
  root.schedule = Schedule;

}).call(this);



