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
        MAX_INT = 4294967295;

    resolution = resolution || 30;
    startTime = startTime ? new Date(startTime) : new Date();

    // configuration
    var project = { schedules: [] },
        people = {},
        tasks = [],
        l = later(resolution * MIN, useLocalTime);

    var cloneTask = function(task) {
      var clone = {};
      for(var name in task) {
        clone[name] = task[name];
      }

      clone.endTime = undefined;
      return clone;
    };

    var updateTask = function(task, start, length) {
      task.startTime = start;
      task.endTime = (task.endTime || task.startTime) + length * MIN;
      task.scheduledMin = (task.scheduledMin || 0) + length;
      task.remainingMin = task.estimatedTime - task.scheduledMin;
    };

    var count = 0;
    var isAvailable = function(task, time, completeCache) {
      var assignedTo = task.assignedTo,
          dependsOn = task.dependsOn,
          earliest = task.earliestStartTime;

      // make sure we are at the earliest start time
      if(earliest && earliest.getTime() > time) {
        return false;
      }

      // make sure any dependencies have been completed
      if(dependsOn) {
        for(var i = 0, len = dependsOn.length; i < len; i++) {
          if(!completeCache[dependsOn[i]]) {
            return false;
          }
        }
      }

      // make sure that assignedTo is available
      if(assignedTo !== undefined) {
        //console.log(assignedTo);
        //console.log(people);
        var person = people[assignedTo];
        if(person.isAvailable) {
          person.isAvailable = false;
          return true;
        }
        else {
          return false;
        }
      }

      return true;
    };

    var updatePerson = function(p, t, isValid) {
      count++;
      p.isValidRange = isValid;
      p.rangeEndTime = isValid ? l.getNextInvalid(p, t) : l.getNext(p, t);
      p.rangeEndTime = p.rangeEndTime ? p.rangeEndTime.getTime() : Number.MAX_VALUE;
    };

    var updatePeople = function(people, time) {
      var t = new Date(time);
      for(var id in people) {
        var person = people[id];

        if(person.rangeEndTime) {
          if (time >= person.rangeEndTime) {
            updatePerson(person, t, !person.isValidRange);
          }
        }
        else {
          updatePerson(person, t, l.isValid(person, t));
        }

        person.isAvailable = person.isValidRange;
      }
    };


    var scheduleTasks = function(tasks) {

      var next = l.getNext(project, startTime),
          nextTime = next ? next.getTime() : undefined,
          rangeEnd = l.getNextInvalid(project, next),
          rangeEndTime = rangeEnd ? rangeEnd.getTime() : Number.MAX_VALUE,
          splitTasks = [],
          inProgressTasks = [],
          scheduledTasks = [],
          completeCache = {},
          nextInProgressTasks,
          i, len, task;

      var trySchedule = function(arrTasks, startTime) {
        var unscheduled = [];
        for(i = 0, len = arrTasks.length; i < len; i++) {
          task = arrTasks[i];

          // see if the assigned to person is available to continue work
          if(isAvailable(task, nextTime, completeCache)) {
            task.startTime = startTime || task.startTime;
            task.endTime = (task.endTime || task.startTime) + resolution * MIN;
            task.scheduledMin = (task.scheduledMin || 0) + resolution;
            task.remainingMin = task.estimatedTime - task.scheduledMin;

            if(task.remainingMin <= 0) {
              completeCache[task.id] = true;
              scheduledTasks.push(task);
            }
            else {
              nextInProgressTasks.push(task);
            }
          }
          else {
            unscheduled.push(task);
          }
        }

        return unscheduled;
      };

      var closeInProgress = function(arrTasks) {
        for(i = 0, len = arrTasks.length; i < len; i++) {
          task = arrTasks[i];
          splitTasks.push(cloneTask(task));
          scheduledTasks.push(task);
        }
      };

      while(nextTime && (splitTasks.length || tasks.length || inProgressTasks.length)) {
        nextInProgressTasks = [];

        updatePeople(people, nextTime);

        // see if any split tasks can make more progress
        if(splitTasks.length) {
          splitTasks = trySchedule(splitTasks, nextTime);
        }

        // see if any in progress tasks can make more progress
        if(inProgressTasks.length) {
          // try to keep any active tasks going, any that can't continue
          // to be scheduled need to be closed
          closeInProgress(trySchedule(inProgressTasks));
        }

        // see if any additional tasks can be scheduled
        if(tasks.length) {
          tasks = trySchedule(tasks, nextTime);
        }

        nextTime += resolution * MIN;

        // if next available time isn't continuous close off in progress tasks
        // and calculate the new range end
        if (nextTime >= rangeEndTime) {
          closeInProgress(nextInProgressTasks);
          nextInProgressTasks = [];

          // recalculate the next contiguous valid block of time
          next = l.getNext(project, new Date(nextTime));
          nextTime = next ? next.getTime() : undefined;
          rangeEnd = l.getNextInvalid(project, next);
          rangeEndTime = rangeEnd ? rangeEnd.getTime() : Number.MAX_VALUE;
        }

        // prepare for next round
        inProgressTasks = nextInProgressTasks;
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
      * The tasks that will be scheduled. Include project taks that will
      * be scheduled along with all tasks that were previously assigned
      * to any of the people (to ensure that a person isn't double booked).
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
            people[person] = {schedules: undefined};
          }
        }


        for(var id in people) {
          people[id].isAvailable = undefined;
          people[id].isValidRange = undefined;
          people[id].rangeEndTime = undefined;
        }


        var schedTasks = scheduleTasks(arrTasks);

        for(i = 0, len = schedTasks.length; i < len; i++) {
          var task = schedTasks[i];
          task.startTime = new Date(task.startTime);
          task.endTime = new Date(task.endTime);
        }

        return schedTasks;
      }

    };
  };

  /**
  * Allow library to be used within both the browser and node.js
  */
  var root = typeof exports !== "undefined" && exports !== null ? exports : window;
  root.schedule = Schedule;

}).call(this);



