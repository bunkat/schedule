var schedule = require('../lib/schedule').schedule,
		later = require('later').later,
		should = require('should');


function task(id, lengthInHours, assignedTo) {
	return {
		id: id,
		length: lengthInHours * 60,
		assignedTo: assignedTo
	};
}

function getResults(results, task) {
	return results.filter(function(r) { return r.id === task.id; });
}

function getResult(results, task) {
	return getResults(results, task)[0];
}




describe('Schedule', function() {

	describe('with no restrictions', function() {

		it('should schedule a single task immediately', function() {
			var now = new Date(2013, 4, 11).getTime(),
					t1 = task(1,4),
					results = schedule(10, now, true)
											.tasks([t1]);

			getResult(results, t1).startTime.getTime().should.equal(now);
		});

		it('should schedule multiple tasks immediately', function() {
			var now = new Date(2013, 4, 11).getTime(),
					t1 = task(1,4),
					t2 = task(1,2),
					results = schedule(10, now, true)
											.tasks([t1,t2]);

			getResult(results, t1).startTime.getTime().should.equal(now);
			getResult(results, t2).startTime.getTime().should.equal(now);
		});

	});

	describe('with assigned tasks', function() {

		it('should schedule a single task immediately', function() {
			var now = new Date(2013, 4, 11).getTime(),
					t1 = task(1, 4, 1),
					results = schedule(10, now, true)
											.tasks([t1]);

			getResult(results, t1).startTime.getTime().should.equal(now);
		});

		it('should schedule tasks assigned to different people immediately', function() {
			var now = new Date(2013, 4, 11).getTime(),
					t1 = task(1, 4, 1),
					t2 = task(1, 2, 2),
					results = schedule(10, now, true)
											.tasks([t1,t2]);

			getResult(results, t1).startTime.getTime().should.equal(now);
			getResult(results, t2).startTime.getTime().should.equal(now);
		});

		it('should schedule tasks assigned to the same person consecutively', function() {
			var now =  new Date('2013-03-11T00:00:00Z'),
					t1 = task(1, 2, 1),
					t1Time = new Date('2013-03-11T04:00:00Z'),
					t2 = task(2, 4, 1),
					t2Time = now;

			var results = schedule(10, now).tasks([t1,t2]);

			getResult(results, t1).startTime.getTime().should.equal(t1Time.getTime());
			getResult(results, t2).startTime.getTime().should.equal(t2Time.getTime());
		});

	});

});