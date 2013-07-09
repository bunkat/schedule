var schedule = require('../../index'),
    later = require('later'),
    p = later.parse.text,
    should = require('should');

// Note: this test is dependent on PST timezone
describe.skip('Example: Elevator reservations', function() {

  it('should produce correct reservations', function() {

    // Step 1: Define our reservations (tasks)
    var reservations = [
      {name: 'Joe', length: 4, availability: 'after 12:00'},
      {name: 'Mike', length: 2},
      {name: 'Frank', length: 8},
      {name: 'John', length: 3, availability: 'on Thurs and Fri'},
      {name: 'Peter', length: 1, availability: 'before 10:00am'},
      {name: 'Sam', length: 2},
      {name: 'Alan', length: 2},
      {name: 'James', length: 8},
      {name: 'Steve', length: 1, availability: 'after 12:00 and before 1:00pm'},
      {name: 'Mark', length: 2},
      {name: 'Alex', length: 8}
    ];

    // Step 2: Define our elevators (resources)
    var elevators = [
      {name: 'E1', availability: 'every weekday after 8:00am and before 4:00pm'},
      {name: 'E2', availability: 'every weekday after 8:00am and before 4:00pm'}
    ];

    // Step 3: Tasks aren't in the right format, need to create a generator
    var t = schedule.tasks()
              .id(function(d) { return d.name; })
              // our length is in hours, convert to minutes
              .duration(function(d) { return d.length * 60; })
              // use later.parse.text to parse text into a usable schedule
              .available(function(d) { return d.availability ? p(d.availability) : undefined; })
              // prioritize our reservations on first come first serve
              .priority(function(d, i) { return 100 - i; })
              // elevator reservations have to be contiguous
              .minSchedule(function(d) { return d.length * 60; })
              // assume that only one elevator is available for reservations to start
              .resources(['E1']);

    var tasks = t(reservations);

    // Step 4: Resources aren't in the right format, need to create a generator
    var r = schedule.resources()
              .id(function(d) { return d.name; })
              .available(function(d) { return d.availability ? p(d.availability) : undefined; });

    var resources = r(elevators);

    // Step 5: Pick a start date for the schedule and set correct timezone
    var start = new Date(2013, 2, 21);
    schedule.date.localTime();

    // Step 6: Create the schedule
    var s = schedule.create(tasks, resources, null, start);

    s.scheduledTasks.Joe.earlyStart.should.eql((new Date(2013,2,21,12,0,0)).getTime());
    s.scheduledTasks.Joe.earlyFinish.should.eql((new Date(2013,2,21,16,0,0)).getTime());
    s.scheduledTasks.Mike.earlyStart.should.eql((new Date(2013,2,21,8,0,0)).getTime());
    s.scheduledTasks.Mike.earlyFinish.should.eql((new Date(2013,2,21,10,0,0)).getTime());
    s.scheduledTasks.Frank.earlyStart.should.eql((new Date(2013,2,22,8,0,0)).getTime());
    s.scheduledTasks.Frank.earlyFinish.should.eql((new Date(2013,2,22,16,0,0)).getTime());
    s.scheduledTasks.John.earlyStart.should.eql((new Date(2013,2,28,8,0,0)).getTime());
    s.scheduledTasks.John.earlyFinish.should.eql((new Date(2013,2,28,11,0,0)).getTime());
    s.scheduledTasks.Peter.earlyStart.should.eql((new Date(2013,2,25,8,0,0)).getTime());
    s.scheduledTasks.Peter.earlyFinish.should.eql((new Date(2013,2,25,9,0,0)).getTime());
    s.scheduledTasks.Sam.earlyStart.should.eql((new Date(2013,2,21,10,0,0)).getTime());
    s.scheduledTasks.Sam.earlyFinish.should.eql((new Date(2013,2,21,12,0,0)).getTime());
    s.scheduledTasks.Alan.earlyStart.should.eql((new Date(2013,2,25,9,0,0)).getTime());
    s.scheduledTasks.Alan.earlyFinish.should.eql((new Date(2013,2,25,11,0,0)).getTime());
    s.scheduledTasks.James.earlyStart.should.eql((new Date(2013,2,26,8,0,0)).getTime());
    s.scheduledTasks.James.earlyFinish.should.eql((new Date(2013,2,26,16,0,0)).getTime());
    s.scheduledTasks.Steve.earlyStart.should.eql((new Date(2013,2,25,12,0,0)).getTime());
    s.scheduledTasks.Steve.earlyFinish.should.eql((new Date(2013,2,25,13,0,0)).getTime());
    s.scheduledTasks.Mark.earlyStart.should.eql((new Date(2013,2,25,13,0,0)).getTime());
    s.scheduledTasks.Mark.earlyFinish.should.eql((new Date(2013,2,25,15,0,0)).getTime());
    s.scheduledTasks.Alex.earlyStart.should.eql((new Date(2013,2,27,8,0,0)).getTime());
    s.scheduledTasks.Alex.earlyFinish.should.eql((new Date(2013,2,27,16,0,0)).getTime());

    // check out how long completing our tasks took
    s.start.should.eql((new Date(2013,2,21,8,0,0)).getTime());
    s.end.should.eql((new Date(2013,2,28,11,0,0)).getTime());

    // It took from 3/21 at 8am until 3/28 at 11am to complete the tasks
    // lets see what happens if we add in a second elevator
    t = t.resources([['E1', 'E2']]); // nested array means OR
    tasks = t(reservations);
    s = schedule.create(tasks, resources, null, start);

    s.scheduledTasks.Joe.earlyStart.should.eql((new Date(2013,2,21,12,0,0)).getTime());
    s.scheduledTasks.Joe.earlyFinish.should.eql((new Date(2013,2,21,16,0,0)).getTime());
    s.scheduledTasks.Mike.earlyStart.should.eql((new Date(2013,2,21,8,0,0)).getTime());
    s.scheduledTasks.Mike.earlyFinish.should.eql((new Date(2013,2,21,10,0,0)).getTime());
    s.scheduledTasks.Frank.earlyStart.should.eql((new Date(2013,2,21,8,0,0)).getTime());
    s.scheduledTasks.Frank.earlyFinish.should.eql((new Date(2013,2,21,16,0,0)).getTime());
    s.scheduledTasks.John.earlyStart.should.eql((new Date(2013,2,22,8,0,0)).getTime());
    s.scheduledTasks.John.earlyFinish.should.eql((new Date(2013,2,22,11,0,0)).getTime());
    s.scheduledTasks.Peter.earlyStart.should.eql((new Date(2013,2,22,8,0,0)).getTime());
    s.scheduledTasks.Peter.earlyFinish.should.eql((new Date(2013,2,22,9,0,0)).getTime());
    s.scheduledTasks.Sam.earlyStart.should.eql((new Date(2013,2,21,10,0,0)).getTime());
    s.scheduledTasks.Sam.earlyFinish.should.eql((new Date(2013,2,21,12,0,0)).getTime());
    s.scheduledTasks.Alan.earlyStart.should.eql((new Date(2013,2,22,9,0,0)).getTime());
    s.scheduledTasks.Alan.earlyFinish.should.eql((new Date(2013,2,22,11,0,0)).getTime());
    s.scheduledTasks.James.earlyStart.should.eql((new Date(2013,2,25,8,0,0)).getTime());
    s.scheduledTasks.James.earlyFinish.should.eql((new Date(2013,2,25,16,0,0)).getTime());
    s.scheduledTasks.Steve.earlyStart.should.eql((new Date(2013,2,22,12,0,0)).getTime());
    s.scheduledTasks.Steve.earlyFinish.should.eql((new Date(2013,2,22,13,0,0)).getTime());
    s.scheduledTasks.Mark.earlyStart.should.eql((new Date(2013,2,22,11,0,0)).getTime());
    s.scheduledTasks.Mark.earlyFinish.should.eql((new Date(2013,2,22,13,0,0)).getTime());
    s.scheduledTasks.Alex.earlyStart.should.eql((new Date(2013,2,25,8,0,0)).getTime());
    s.scheduledTasks.Alex.earlyFinish.should.eql((new Date(2013,2,25,16,0,0)).getTime());

    // now we can end on 3/25
    s.start.should.eql((new Date(2013,2,21,8,0,0)).getTime());
    s.end.should.eql((new Date(2013,2,25,16,0,0)).getTime());
  });

});