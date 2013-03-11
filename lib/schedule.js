/**
* Schedule.js
* (c) 2013 Bill, BunKat LLC.
* Schedule is freely distributable under the MIT license.
* For all details and documentation:
*     http://bunkat.github.com/schedule
*/
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
    * @param {Bool} useLocalTime: True if local time zone should be used
    * @api public
    */
    var Schedule = function(resolution, useLocalTime) {



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
            * @param {Array} arr: Array of tasks to include in the schedule.
            * @api public
            */
            tasks: function (arr) {


            }

        };
    };

    /**
    * Allow library to be used within both the browser and node.js
    */
    var root = typeof exports !== "undefined" && exports !== null ? exports : window;
    root.schedule = Schedule;

}).call(this);



