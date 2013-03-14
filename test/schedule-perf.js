var schedule = require('../lib/schedule').schedule,
    util = require('./util'),
    later = require('later').later,
    recur = require('later').recur,
    should = require('should');


describe('Schedule', function() {

  it('performance', function() {
    this.timeout(1000);

    var now = new Date(2013, 4, 11),
        project = recur().onWeekday().afterTime('09:00').beforeTime('17:00'),
        tasks = [];

    for(var i = 1; i < 500; i++) {
      tasks.push(util.task(i, util.randInt(1, 240), util.randInt(1,20)));
    }

    var s = schedule(10, now, true).project(project).tasks(tasks);

    //console.log(s);


  });

});