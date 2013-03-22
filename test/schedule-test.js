var schedule = require('../lib/schedule').schedule,
    util = require('./util'),
		later = require('later').later,
    recur = require('later').recur,
		should = require('should');


describe('Schedule', function() {

	describe('with no restrictions', function() {

		it('should schedule a single task immediately', function() {
      var now = new Date(2013, 4, 11),
					t1 = util.task(1,4),
          t1Expected = [util.calcSchedule(now, t1.estimatedTime)],
					s = schedule(10, now, true).tasks([t1]);

      util.getTaskSchedule(s, t1).should.eql(t1Expected);
		});

		it('should schedule multiple tasks immediately', function() {
			var now = new Date(2013, 4, 11),
					t1 = util.task(1,4),
          t1Expected = [util.calcSchedule(now, t1.estimatedTime)],
					t2 = util.task(2,2),
          t2Expected = [util.calcSchedule(now, t2.estimatedTime)],
					s = schedule(10, now, true).tasks([t1,t2]);

      util.getTaskSchedule(s, t1).should.eql(t1Expected);
      util.getTaskSchedule(s, t2).should.eql(t2Expected);
		});

	});

	describe('with a project schedule', function() {

    it('should schedule a single task at valid project time', function() {
      var now = new Date(2013, 4, 11),
          project = recur().onWeekday().afterTime('09:00').beforeTime('17:00'),
          t1 = util.task(1, 4, 1),
          t1Expected = [util.calcSchedule(new Date(2013, 4, 13, 9, 0, 0), t1.estimatedTime)],
          s = schedule(10, now, true).project(project).tasks([t1]);

      util.getTaskSchedule(s, t1).should.eql(t1Expected);
    });

    it('should break up a task that spans multiple days', function() {
      var now = new Date(2013, 4, 11),
          project = recur().onWeekday().afterTime('09:00').beforeTime('17:00'),
          t1 = util.task(1, 12, 1),
          t1Expected = [
            util.calcSchedule(new Date(2013, 4, 13, 9, 0, 0), 8 * 60),
            util.calcSchedule(new Date(2013, 4, 14, 9, 0, 0), 4 * 60)
          ],
          s = schedule(10, now, true).project(project).tasks([t1]);

      util.getTaskSchedule(s, t1).should.eql(t1Expected);
    });

    it('should break up a task that spans multiple days with lunch', function() {
      var now = new Date(2013, 4, 11),
          project = recur().onWeekday().afterTime('09:00').beforeTime('17:00')
                           .except().afterTime('12:00').beforeTime('13:00'),
          t1 = util.task(1, 12, 1),
          t1Expected = [
            util.calcSchedule(new Date(2013, 4, 13, 9, 0, 0), 3 * 60),
            util.calcSchedule(new Date(2013, 4, 13, 13, 0, 0), 4 * 60),
            util.calcSchedule(new Date(2013, 4, 14, 9, 0, 0), 3 * 60),
            util.calcSchedule(new Date(2013, 4, 14, 13, 0, 0), 2 * 60)
          ],
          s = schedule(10, now, true).project(project).tasks([t1]);

      util.getTaskSchedule(s, t1).should.eql(t1Expected);
    });

	});

  describe('with a worker schedule', function() {

    it('should schedule a single task at valid worker times', function() {
      var now = new Date(2013, 3, 11),
          workers = {"1": recur().every(2).hour()},
          t1 = util.task(1, 3, 1),
          t1Expected = [
            util.calcSchedule(new Date(2013, 3, 11, 0, 0, 0), 1 * 60),
            util.calcSchedule(new Date(2013, 3, 11, 2, 0, 0), 1 * 60),
            util.calcSchedule(new Date(2013, 3, 11, 4, 0, 0), 1 * 60)
          ],
          s = schedule(10, now, true).people(workers).tasks([t1]);

      util.getTaskSchedule(s, t1).should.eql(t1Expected);
    });

  });

	describe('with assigned tasks', function() {

		it('should schedule a single task immediately', function() {
			var now = new Date(2013, 4, 11),
					t1 = util.task(1, 4, 1),
          t1Expected = [util.calcSchedule(now, t1.estimatedTime)],
					s = schedule(10, now, true).tasks([t1]);

			util.getTaskSchedule(s, t1).should.eql(t1Expected);
		});

		it('should schedule tasks assigned to different people immediately', function() {
			var now = new Date(2013, 4, 11),
					t1 = util.task(1, 4, 1),
          t1Expected = [util.calcSchedule(now, t1.estimatedTime)],
					t2 = util.task(2, 2, 2),
          t2Expected = [util.calcSchedule(now, t2.estimatedTime)],
					s = schedule(10, now, true).tasks([t1,t2]);

      util.getTaskSchedule(s, t1).should.eql(t1Expected);
      util.getTaskSchedule(s, t2).should.eql(t2Expected);
		});

		it('should schedule tasks assigned to the same person consecutively', function() {
      var now = new Date(2013, 4, 11),
          t1 = util.task(1, 4, 1),
          t1Expected = [util.calcSchedule(now, t1.estimatedTime)],
          t2 = util.task(2, 2, 1),
          t2Expected = [util.calcSchedule(t1Expected[0][1], t2.estimatedTime)],
          s = schedule(10, now, true).tasks([t1,t2]);

      util.getTaskSchedule(s, t1).should.eql(t1Expected);
      util.getTaskSchedule(s, t2).should.eql(t2Expected);
		});

	});

  describe('with dependent tasks', function() {

    it('should schedule required tasks first', function() {
      var now = new Date(2013, 4, 11),
          t1 = util.task(1, 4, 1, [2]),
          t2 = util.task(2, 2, 1),
          t2Expected = [util.calcSchedule(now, t2.estimatedTime)],
          t1Expected = [util.calcSchedule(t2Expected[0][1], t1.estimatedTime)],
          s = schedule(10, now, true).tasks([t1,t2]);

      util.getTaskSchedule(s, t1).should.eql(t1Expected);
      util.getTaskSchedule(s, t2).should.eql(t2Expected);
    });


  });

  describe('with earliest start time', function() {

    it('should wait to schedule tasks', function() {
      var now = new Date(2013, 4, 11),
          t1 = util.task(1, 4, 1, null, new Date(2013, 5, 1)),
          t2 = util.task(2, 2, 1),
          t1Expected = [util.calcSchedule(new Date(2013,5,1), t1.estimatedTime)],
          t2Expected = [util.calcSchedule(now, t2.estimatedTime)],
          s = schedule(10, now, true).tasks([t1,t2]);

      util.getTaskSchedule(s, t1).should.eql(t1Expected);
      util.getTaskSchedule(s, t2).should.eql(t2Expected);
    });


  });


});