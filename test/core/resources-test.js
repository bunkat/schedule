var schedule = require('../../index'),
    later = require('later'),
    should = require('should');

describe('Resources', function() {

  it('should support custom id function', function() {
    should.exist(schedule.resources().id);
  });

  it('should support a custom schedule function', function() {
    should.exist(schedule.resources().schedule);
  });

  it('should support a custom isNotReservable function', function() {
    should.exist(schedule.resources().isNotReservable);
  });

  it('should return resources in a map using defaults', function() {
    var sched = later.parse.recur().after('8:00').time().before('17:00').time(),
        resources = [ {id: 1, schedule: sched}, {id: 2, schedule: sched}, {id: 3, schedule: sched} ],
        expected = {
          '1': {id: 1, schedule: sched, isNotReservable: false},
          '2': {id: 2, schedule: sched, isNotReservable: false},
          '3': {id: 3, schedule: sched, isNotReservable: false}
        },
        actual = schedule.resources(resources)();

    actual.should.eql(expected);
  });

  it('should return resources in a map using a custom id function', function() {
    var sched = later.parse.recur().after('8:00').time().before('17:00').time(),
        resources = [ {foo: 1, schedule: sched}, {foo: 2, schedule: sched}, {foo: 3, schedule: sched} ],
        expected = {
          '1': {id: 1, schedule: sched, isNotReservable: false},
          '2': {id: 2, schedule: sched, isNotReservable: false},
          '3': {id: 3, schedule: sched, isNotReservable: false}
        },
        actual = schedule.resources(resources).id(function(d){return d.foo;})();

    actual.should.eql(expected);
  });

  it('should return resources in a map using a custom schedule function', function() {
    var sched = later.parse.recur().after('8:00').time().before('17:00').time(),
        resources = [ {id: 1, foo: sched}, {id: 2, foo: sched}, {id: 3, foo: sched} ],
        expected = {
          '1': {id: 1, schedule: sched, isNotReservable: false},
          '2': {id: 2, schedule: sched, isNotReservable: false},
          '3': {id: 3, schedule: sched, isNotReservable: false}
        },
        actual = schedule.resources(resources).schedule(function(d){return d.foo;})();

    actual.should.eql(expected);
  });

  it('should return resources in a map using a custom reservable function', function() {
    var sched = later.parse.recur().after('8:00').time().before('17:00').time(),
        resources = [ {id: 1, schedule: sched}, {id: 2, schedule: sched}, {id: 3, schedule: sched} ],
        expected = {
          '1': {id: 1, schedule: sched, isNotReservable: true},
          '2': {id: 2, schedule: sched, isNotReservable: true},
          '3': {id: 3, schedule: sched, isNotReservable: true}
        },
        actual = schedule.resources(resources).isNotReservable(true)();

    actual.should.eql(expected);
  });

});