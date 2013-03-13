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
        HOUR = MIN * 60,
        DAY = HOUR * 24;

    resolution = resolution ? resolution * MIN : 30 * MIN;
    startTime = startTime ? new Date(startTime) : new Date();

    // data prototypes to switch between UTC and local time calculations
    var dateProto = Date.prototype,
        get = 'get' + (useLocalTime ? '' : 'UTC'),
        getYear = dateProto[get + 'FullYear'],
        getMonth = dateProto[get + 'Month'],
        getDate = dateProto[get + 'Date'],
        getDay = dateProto[get + 'Day'],
        getHour = dateProto[get + 'Hours'],
        getMin = dateProto[get + 'Minutes'],
        getSec = dateProto[get + 'Seconds'];

    // configuration
    var project = { schedules: [] },
        people = {},
        tasks = [],
        l = later(resolution, useLocalTime);



    /**
    * Builds and returns a new Date using the specified values.  Date
    * returned is either using Local time or UTC based on isLocal.
    *
    * @param {Int} yr: Four digit year
    * @param {Int} mt: Month between 0 and 11, defaults to 0
    * @param {Int} dt: Date between 1 and 31, defaults to 1
    * @param {Int} hr: Hour between 0 and 23, defaults to 0
    * @param {Int} mn: Minute between 0 and 59, defaults to 0
    * @param {Int} sc: Second between 0 and 59, defaults to 0
    */
    var date = function(yr, mt, dt, hr, mn, sc) {
        mt = mt === undefined ? 0 : mt;
        dt = dt === undefined ? 1 : dt;
        hr = hr === undefined ? 0 : hr;
        mn = mn === undefined ? 0 : mn;
        sc = sc === undefined ? 0 : sc;

        return useLocalTime ? new Date(yr, mt, dt, hr, mn, sc) :
            new Date(Date.UTC(yr, mt, dt, hr, mn, sc));
    };

    /**
    * Pads a digit with a leading zero if it is less than 10.
    *
    * @param {Int} val: The value that needs to be padded
    */
    var pad = function(val) {
        return (val < 10 ? '0' : '') + val;
    };

    /**
    * Returns the different components of a date..
    *
    * @param {Int} d: The date to get the components for.
    */
    var getDateComponents = function(d) {
      return {
        Y: getYear.call(d),
        M: getMonth.call(d),
        D: getDate.call(d),
        h: getHour.call(d),
        m: getMin.call(d),
        s: getSec.call(d)
      };
    };

    /**
    * Returns a new date object that represents the next possible valid
    * occurrence based on the resolution that has beeen configured.
    *
    * @param {Date} date: The Date object to be incremented
    */
    var tick = function (date) {
        return new Date(date.getTime() + resolution);
    };

    var isNotComplete = function(val) {
      return val.length !== 0;
    };

    var getPerson = function(id) {
      return id ? people[id] || (people[id]={schedules: [], exceptions: []}) :
                  {schedules: [], exceptions: []};
    };

    var createTaskSchedule = function(task, start, length) {
      var s = getDateComponents(start);

      return {
        id: task.id,
        startTime: start,
        endTime: date(s.Y, s.M, s.D, s.h, s.m + length, s.s),
        length: length,
        assignedTo: task.assignedTo
      };
    };

    var createException = function(taskSchedule) {
      var start = getDateComponents(taskSchedule.startTime),
          end = getDateComponents(taskSchedule.endTime);

      return {
        Y: [start.Y],
        M: [start.M+1],  // month starts at 1 in Later schedules
        D: [start.D],
        ta: [pad(start.h) +':'+ pad(start.m) +':'+ pad(start.s)],
        tb: [pad(end.h) +':'+ pad(end.m) +':'+ pad(end.s)]
      };
    };



    var sortTasks = function(arrTasks) {

      var tasks = [], len = arrTasks.length;

      // make a copy of the properties we care about
      while(len--) {
        var task = arrTasks[len];
        tasks.push({
          id: task.id,
          length: task.length,
          assignedTo: task.assignedTo
        });
      }

      return tasks;
    };


    var scheduleTasks = function(arrTasks) {

      var tasks = sortTasks(arrTasks),
          t = l.getNext(project, startTime),
          scheduleTasks = [];

      while(tasks.length) {

        for(var i = 0, len = tasks.length; i < len; i++) {
          var task = tasks[i],
              person = getPerson(task.assignedTo),
              st = createTaskSchedule(task, t, task.length);

          // see if the person's schedule is free
          if(l.isValid(person, t)) {
            scheduleTasks.push(st); // add schedule
            person.exceptions.push(createException(st)); //mark person as busy
            task.length = 0;
          }
        }

        t = l.getNext(project, tick(t));
        tasks = tasks.filter(isNotComplete);
      }

      return scheduleTasks;
    };


    return {

      /**
      * Configures details about the project that is being scheduled.
      *
      * @param {Obj} options: Project options including schedule
      * @api public
      */
      project: function (options) {

      },

      /**
      * Configures details about the people that tasks are assigned to.
      *
      * @param {Obj} options: People options including schedule
      * @api public
      */
      people: function (options) {

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



