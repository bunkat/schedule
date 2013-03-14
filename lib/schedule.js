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

    resolution = resolution || 30;
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
        l = later(resolution * MIN, useLocalTime);



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
        return new Date(date.getTime() + resolution * MIN);
    };

    var getPerson = function(id) {
      return id ? people[id] || (people[id]={schedules: [], exceptions: []}) :
                  {schedules: [], exceptions: []};
    };

    var isAvailable = function (task, t) {
      // see if the assigned to person is available to work on this task
      return task.assignedTo ? l.isValid(getPerson(task.assignedTo), t) : true;
    };

    // split a task schedule into a finished and unfinished component
    var cloneTask = function(task) {
      return {
        id: task.id,
        estimatedTime: task.estimatedTime,
        assignedTo: task.assignedTo,
        startTime: task.startTime,
        endTime: task.endTime,
        scheduledMin: task.scheduledMin,
        remainingMin: task.remainingMin
      };
    };

    var updateTask = function(task, start, length) {
      task.startTime = start;
      task.endTime = task.endTime || start;
      var s = getDateComponents(task.endTime);

      task.scheduledMin = (task.scheduledMin || 0) + length;
      task.remainingMin = task.estimatedTime - task.scheduledMin;
      task.endTime = date(s.Y, s.M, s.D, s.h, s.m + length, 0);
    };

    var scheduleTasks = function(tasks) {

      var t = l.getNext(project, startTime),
          splitTasks = [],
          inProgressTasks = [],
          scheduledTasks = [];

      while(t && (splitTasks.length || tasks.length || inProgressTasks.length)) {
        //console.log(t);

        var i, len, task, markedBusy = {};

        // see if any split tasks can make more progress
        for(i = 0, len = splitTasks.length; i < len; i++) {
          //console.log('split');
          task = splitTasks.shift();

          // see if the assigned to person is available to continue work
          if(!markedBusy[task.assignedTo] && isAvailable(task, t)) {
            task.startTime = task.endTime = t;
            inProgressTasks.unshift(task);

            //if(task.assignedTo) markedBusy[task.assignedTo] = true;
            //updateTask(task, t, resolution);
            //(task.remainingMin > 0 ? inProgressTasks : scheduledTasks).push(task);
          }
          else {
            splitTasks.push(task);
          }
        }

        // see if any in progress tasks can make more progress
        for(i = 0, len = inProgressTasks.length; i < len; i++) {
          //console.log('in progress');
          task = inProgressTasks.shift();

          // see if the assigned to person is available to continue work
          if(!markedBusy[task.assignedTo] && isAvailable(task, t)) {
            if(task.assignedTo) markedBusy[task.assignedTo] = true;
            updateTask(task, task.startTime, resolution);
            //console.log(task);
            (task.remainingMin > 0 ? inProgressTasks : scheduledTasks).push(task);
          }
          else {
            splitTasks.push(cloneTask(task));
            scheduledTasks.push(task);
          }
        }

        // see if any additional tasks can be scheduled
        for(i = 0, len = tasks.length; i < len; i++) {
          //console.log('new');
          task = tasks.shift();

          // see if the assigned to person is available to work on this task
          if(!markedBusy[task.assignedTo] && isAvailable(task, t)) {
            if(task.assignedTo) markedBusy[task.assignedTo] = true;
            updateTask(task, t, resolution);
            (task.remainingMin > 0 ? inProgressTasks : scheduledTasks).push(task);
          }
          else {
            tasks.push(task);
          }
        }

        //console.log(t);

        var next = tick(t);
        t = l.getNext(project, next);

        //console.log(next);
        //console.log(t);


        // if time isn't continuous close off any in progress tasks
        if (next.getTime() !== t.getTime()) {
          for(i = 0, len = inProgressTasks.length; i < len; i++) {
            task = inProgressTasks.shift();
            splitTasks.push(cloneTask(task));
            scheduledTasks.push(task);
          }
        }

      }

      //console.log(scheduledTasks);
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



