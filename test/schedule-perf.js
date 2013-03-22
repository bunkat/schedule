var schedule = require('../lib/schedule').schedule,
    util = require('./util'),
    later = require('later').later,
    recur = require('later').recur,
    should = require('should');


describe('Schedule', function() {

  it.skip('large performance', function() {
    this.timeout(1000);

    var now = new Date(2013, 4, 11),
        workers = {
          "1": recur().except().afterTime("12:00").beforeTime("13:00"),
          "2": recur().except().afterTime("12:00").beforeTime("13:00"),
          "3": recur().except().afterTime("12:00").beforeTime("13:00"),
          "4": recur().except().afterTime("12:00").beforeTime("13:00"),
          "5": recur().except().afterTime("12:00").beforeTime("13:00"),
          "6": recur().except().afterTime("12:00").beforeTime("13:00"),
          "7": recur().except().afterTime("12:00").beforeTime("13:00"),
          "8": recur().except().afterTime("12:00").beforeTime("13:00"),
          "9": recur().except().afterTime("12:00").beforeTime("13:00"),
          "10": recur().except().afterTime("12:00").beforeTime("13:00")
        },
        project = recur().onWeekday().afterTime('09:00').beforeTime('17:00'),
        tasks = [];

    for(var i = 1; i < 500; i++) {
      tasks.push(util.task(i, util.randInt(1, 40), util.randInt(1,20)));
    }

    var s = schedule(15, now, true).people(workers).project(project).tasks(tasks);
  });

  it('general performance', function() {
    this.timeout(1000);

    var now = new Date(2013, 4, 11),
        workers = {
          "1": recur().except().afterTime("12:00").beforeTime("13:00"),
          "2": recur().except().afterTime("10:00").beforeTime("13:00"),
          "3": recur().except().afterTime("12:00").beforeTime("13:00"),
          "4": recur().except().afterTime("12:00").beforeTime("13:00"),
          "5": recur().except().afterTime("12:00").beforeTime("16:00"),
          "6": recur().except().afterTime("12:00").beforeTime("13:00"),
          "7": recur().except().afterTime("12:00").beforeTime("13:00"),
          "8": recur().except().afterTime("15:00").beforeTime("19:00"),
          "9": recur().except().afterTime("12:00").beforeTime("13:00"),
          "10": recur().except().afterTime("12:00").beforeTime("13:00")
        },
        project = recur().onWeekday().afterTime('09:00').beforeTime('17:00');

    var total = 0;
    for(var j = 0; j < 10; j++) {

      var tasks = [];
      for(var i = 1; i < 500; i++) {
        tasks.push(util.task(i, (i % 7) * 4, i % 10));
      }

      var timer = process.hrtime();

      var s = schedule(15, now, true).people(workers).project(project).tasks(tasks);

      var diff = process.hrtime(timer);
      total += (diff[0] * 1e9 + diff[1]) / 1e6;
    }

    console.log('benchmark took %d milliseconds', total / 10);
  });

});