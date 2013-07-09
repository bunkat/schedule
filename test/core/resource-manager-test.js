var schedule = require('../../index'),
    later = require('later'),
    should = require('should'),
    util = require('util');


describe('Resource Manager', function() {

  // resource setup
  var resources = [
        {id: 'A', available: {schedules: [{h_a: [8], h_b: [16]}]}},
        {id: 'B', available: {schedules: [{h_a: [10], h_b: [14]}]}},
        {id: 'C', available: {schedules: [{h_a: [8], h_b: [12]}]}},
        {id: 'D', available: {schedules: [{h_a: [18], h_b: [20]}]}},
        {id: 'E', available: {schedules: [{h_a: [12], h_b: [14]}]}},

        // resource definition for the project schedule
        {id: '_proj', available: {schedules: [{h_a: [6], h_b: [20]}]}, isNotReservable: true}
      ],
      startDate = new Date(2013, 2, 21);

  // set to use local time
  schedule.date.localTime();

  describe('make reservation', function() {

    it('should include requested resource', function() {
      var mgr = schedule.resourceManager(resources, startDate),
          res = mgr.makeReservation(['_proj', 'A'], startDate);

      res.resources.should.eql(['A']);
      res.success.should.eql(true);
    });

    it('should include requested resource when multiple', function() {
      var mgr = schedule.resourceManager(resources, startDate),
          res = mgr.makeReservation(['_proj', 'A', 'B'], startDate);

      res.resources.should.eql(['A', 'B']);
      res.success.should.eql(true);
    });

    it('should include only reserved resources with OR', function() {
      var mgr = schedule.resourceManager(resources, startDate),
          res = mgr.makeReservation(['_proj', ['A', 'B']], startDate);

      res.resources.should.eql(['A']);
      res.success.should.eql(true);
    });

    it('should reserve resource at earliest available time', function() {
      var mgr = schedule.resourceManager(resources, startDate),
          res = mgr.makeReservation(['_proj', 'A'], startDate);

      res.start.should.eql((new Date(2013, 2, 21, 8, 0, 0)).getTime());
      res.success.should.eql(true);
    });

    it('should reserve multiple resource at earliest available overlap', function() {
      var mgr = schedule.resourceManager(resources, startDate),
          res = mgr.makeReservation(['_proj', 'A', 'B'], startDate);

      res.start.should.eql((new Date(2013, 2, 21, 10, 0, 0)).getTime());
      res.success.should.eql(true);
    });

    it('should reserve earliest available resource on OR', function() {
      var mgr = schedule.resourceManager(resources, startDate),
          res = mgr.makeReservation(['_proj', ['A', 'B']], startDate);

      res.start.should.eql((new Date(2013, 2, 21, 8, 0, 0)).getTime());
      res.success.should.eql(true);
    });

    it('should reserve earliest available resource on multiple AND', function() {
      var mgr = schedule.resourceManager(resources, startDate),
          res = mgr.makeReservation(['_proj', 'A', 'B', 'E'], startDate);

      res.start.should.eql((new Date(2013, 2, 21, 12, 0, 0)).getTime());
      res.success.should.eql(true);
    });

    it('should reserve for minimum duration specified', function() {
      var d = new Date(2013, 2, 21, 12, 0, 0),
          mgr = schedule.resourceManager(resources, d),
          res = mgr.makeReservation(['_proj', 'B'], d, 240);

      res.start.should.eql((new Date(2013, 2, 22, 10, 0, 0)).getTime());
      res.duration.should.eql(240);
      res.success.should.eql(true);
    });

    it('should reserve for minimum duration specified using OR', function() {
      var d = new Date(2013, 2, 21, 16, 0, 0),
          mgr = schedule.resourceManager(resources, d),
          res = mgr.makeReservation(['_proj', ['B', 'D']], d, 240);

      res.start.should.eql((new Date(2013, 2, 22, 10, 0, 0)).getTime());
      res.duration.should.eql(240);
      res.success.should.eql(true);
    });

    it('should reserve for maximum duration specified', function() {
      var d = new Date(2013, 2, 21, 12, 0, 0),
          mgr = schedule.resourceManager(resources, d),
          res = mgr.makeReservation(['_proj', 'B'], d, 1, 30);

      res.start.should.eql((new Date(2013, 2, 21, 12, 0, 0)).getTime());
      res.duration.should.eql(30);
      res.success.should.eql(true);
    });

    it('success should be false if reservation could not be made', function() {
      var mgr = schedule.resourceManager(resources, startDate),
          res = mgr.makeReservation(['_proj', 'B', 'D'], startDate);

      res.success.should.eql(false);
    });

    it('should maintain consecutive reservations', function() {
      var mgr = schedule.resourceManager(resources, startDate),
          resA = mgr.makeReservation(['_proj', 'A'], startDate, 1, 240),
          resB = mgr.makeReservation(['_proj', 'A'], startDate, 1, 240);

      resA.start.should.eql((new Date(2013, 2, 21, 8, 0, 0)).getTime());
      resA.duration.should.eql(240);
      resA.success.should.eql(true);

      resB.start.should.eql((new Date(2013, 2, 21, 12, 0, 0)).getTime());
      resB.duration.should.eql(240);
      resB.success.should.eql(true);
    });

    it('should maintain non-consecutive reservations', function() {
      var mgr = schedule.resourceManager(resources, startDate),
          resA = mgr.makeReservation(['_proj', 'A', 'B'], startDate, 1, 240),
          resB = mgr.makeReservation(['_proj', 'A'], startDate, 1, 120);

      resA.start.should.eql((new Date(2013, 2, 21, 10, 0, 0)).getTime());
      resA.duration.should.eql(240);
      resA.success.should.eql(true);

      resB.start.should.eql((new Date(2013, 2, 21, 8, 0, 0)).getTime());
      resB.duration.should.eql(120);
      resB.success.should.eql(true);
    });

  });

  describe('move start date', function() {

    it('should remove exceptions occurring before date', function() {
      var mgr = schedule.resourceManager(resources, startDate),
          resA = mgr.makeReservation(['_proj', 'A', 'B'], startDate, 1, 240),
          resB = mgr.makeReservation(['_proj', 'A', 'B'], startDate, 1, 120),
          resC = mgr.makeReservation(['_proj', 'A', 'B'], startDate, 1, 240),
          resD = mgr.makeReservation(['_proj', 'A', 'B'], startDate, 1, 120);

      mgr.getResource('A').schedule.exceptions.length.should.eql(4);

      mgr.optimize(new Date(2013,2, 22).getTime());
      mgr.getResource('A').schedule.exceptions.length.should.eql(3);

      mgr.optimize(new Date(2013,2, 23).getTime());
      mgr.getResource('A').schedule.exceptions.length.should.eql(1);

      mgr.optimize(new Date(2013,2, 24).getTime());
      mgr.getResource('A').schedule.exceptions.length.should.eql(0);
    });

  });

});