var schedule = require('../../index'),
    later = require('later'),
    should = require('should'),
    util = require('util');

describe.skip('Schedule', function() {

  it('should do something', function() {

    var tasks = [
          {id: 'A', duration: 480, resources: ['A']},
          {id: 'B', duration: 240, dependsOn: ['A'], resources: ['A'] },
          {id: 'C', duration: 120, dependsOn: ['A'], resources: ['A'] },
          {id: 'D', duration: 360, dependsOn: ['A'], resources: ['A'] },
          {id: 'E', duration: 120, dependsOn: ['B', 'C'], resources: ['A'] },
          {id: 'F', duration: 420, dependsOn: ['C'], resources: ['A'] },
          {id: 'G', duration: 240, dependsOn: ['E'], resources: ['A'] },
          {id: 'H', duration: 480, dependsOn: ['E', 'F'], resources: ['A'] },
          {id: 'I', duration: 240, dependsOn: ['D'], resources: ['A'] },
          {id: 'J', duration: 240, dependsOn: ['G','H','I'], resources: ['A'] }
        ];

    var resources = [
          {id: 'A', schedule: {schedules: [{dw: [2,3,4,5,6], h_a: [8], h_b: [16]}]}},
          {id: 'B', schedule: {schedules: [{dw: [2,3], h_a: [10], h_b: [14]}]}},
          {id: 'C', schedule: {schedules: [{dw: [5,6], h_a: [8], h_b: [12]}]}}
        ];

  // quick and dirty function memoization
/*  function memoizedFn(fn) {
    var cache = {};

    return function(start) {
      if(cache[start]) return cache[start];
      var result = fn(1, start);
      return (cache[start] = [result[0].getTime(), result[1].getTime()]);
    };
  }

    var resManager = schedule.resourceManager(resources, new Date(2013, 2, 1)),
        sched = {schedules: [{dw: [2,3,4,5,6], h_a: [8], h_b: [16]}]},
        sNext = memoizedFn(later.schedule(sched).nextRange),
        neededRes = [['B','C'], 'A'],
        start = new Date(2013, 2, 1);

    var time = process.hrtime();
    var reservation = resManager.makeReservation(neededRes, sNext, start, 60, 280);
    for(var i = 0; i < 5; i++) {
      start = new Date(reservation.start + (reservation.duration * later.MIN));
      resManager.moveStartDate(start);
      reservation = resManager.makeReservation(neededRes, sNext, start, 60, 280);
      console.log(reservation);
      console.log('-------------------');
    }
    var diff = process.hrtime(time);
    console.log('benchmark took %d nanoseconds', diff[0] * 1e9 + diff[1]);*/

/*    var time = process.hrtime();

    var next = resManager.next(['A', 'B'], sNext, new Date(2013, 2, 1), 60, 280);

    for(var i = 0; i < 5; i++) {
      next = resManager.next(['A', 'B'], sNext, next[1], 60, 280);
      resManager.moveStartDate(next[1]);
      console.log(next);
    }
    var diff = process.hrtime(time);

    console.log('benchmark took %d nanoseconds', diff[0] * 1e9 + diff[1]);*/

//    console.log(later.fd.prev(new Date(2012, 3, 4), (new Date(2013, 2, 1)).getTime()));



    var graph = schedule.dependencyGraph(tasks),
        sched = {schedules: [{dw: [2,3,4,5,6], h_a: [8], h_b: [16]}]},
        start = new Date(2013, 2, 21);

    //var time = process.hrtime();
   // var optimal = schedule.schedule(graph, sched, start);
    //var diff = process.hrtime(time);

    //console.log(util.inspect(optimal, { depth: null }));
    //console.log('benchmark took %d nanoseconds', diff[0] * 1e9 + diff[1]);


  });


});