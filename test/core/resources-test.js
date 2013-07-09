var schedule = require('../../index'),
    later = require('later'),
    should = require('should');

describe('Resources', function() {

  it('should support custom id function', function() {
    should.exist(schedule.resources().id);
  });

  it('should support a custom schedule function', function() {
    should.exist(schedule.resources().available);
  });

  it('should support a custom isNotReservable function', function() {
    should.exist(schedule.resources().isNotReservable);
  });

  it('should return resources in a list using defaults', function() {
    var sched = later.parse.recur().after('8:00').time().before('17:00').time(),
        resources = [ {id: 1, available: sched}, {id: 2, available: sched}, {id: 3, available: sched} ],
        expected = [
          {id: 1, available: sched, isNotReservable: false},
          {id: 2, available: sched, isNotReservable: false},
          {id: 3, available: sched, isNotReservable: false}
        ],
        actual = schedule.resources()(resources);

    actual.should.eql(expected);
  });

  it('should return resources in a list using a custom id function', function() {
    var sched = later.parse.recur().after('8:00').time().before('17:00').time(),
        resources = [ {foo: 1, available: sched}, {foo: 2, available: sched}, {foo: 3, available: sched} ],
        expected = [
          {id: 1, available: sched, isNotReservable: false},
          {id: 2, available: sched, isNotReservable: false},
          {id: 3, available: sched, isNotReservable: false}
        ],
        actual = schedule.resources().id(function(d){return d.foo;})(resources);

    actual.should.eql(expected);
  });

  it('should return resources in a list using a custom schedule function', function() {
    var sched = later.parse.recur().after('8:00').time().before('17:00').time(),
        resources = [ {id: 1, foo: sched}, {id: 2, foo: sched}, {id: 3, foo: sched} ],
        expected = [
          {id: 1, available: sched, isNotReservable: false},
          {id: 2, available: sched, isNotReservable: false},
          {id: 3, available: sched, isNotReservable: false}
        ],
        actual = schedule.resources().available(function(d){return d.foo;})(resources);

    actual.should.eql(expected);
  });

  it('should return resources in a list using a custom reservable function', function() {
    var sched = later.parse.recur().after('8:00').time().before('17:00').time(),
        resources = [ {id: 1, available: sched}, {id: 2, available: sched}, {id: 3, available: sched} ],
        expected = [
          {id: 1, available: sched, isNotReservable: true},
          {id: 2, available: sched, isNotReservable: true},
          {id: 3, available: sched, isNotReservable: true}
        ],
        actual = schedule.resources().isNotReservable(true)(resources);

    actual.should.eql(expected);
  });

});