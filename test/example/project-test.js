var schedule = require('../../index'),
    later = require('later'),
    p = later.parse.text,
    should = require('should'),
    util = require('util');

// Note: this test is dependent on PST timezone
describe.skip('Example: Paint room project', function() {

  it('should produce correct project schedule', function() {

    // Step 1: Define our work items (tasks)
    var workItems = [
      {
        name: 'Purchase supplies',
        length: 2,
        minSchedule: 2, // have to schedule all 2 hours at once
        assignedTo: ['Bob', 'Sara'], // both Bob and Sara are needed
        availability: 'after 8:00am and before 9:00pm' //can only complete when paint store is open
      },
      {
        name: 'Remove doors',
        length: 0.5,
        assignedTo: ['Bob']
      },
      {
        name: 'Clear furniture',
        length: 1,
        assignedTo: [['Sara', 'Bob']]
      },
      {
        name: 'Protect carpet',
        dependsOn: ['Purchase supplies', 'Clear furniture', 'Remove doors'],
        length: 2,
        assignedTo: [['Bob', 'Sara']] // either Bob or Sara is needed
      },
      {
        name: 'Paint trim',
        dependsOn: ['Protect carpet'],
        length: 3,
        assignedTo: [['Bob', 'Sara']]
      },
      {
        name: 'Paint walls',
        dependsOn: ['Protect carpet'],
        length: 5,
        assignedTo: [['Bob', 'Sara']]
      },
      {
        name: 'Paint doors',
        dependsOn: ['Remove doors', 'Protect carpet'],
        length: 2,
        assignedTo: [['Bob', 'Sara']]
      },
      {
        name: 'Cleanup',
        dependsOn: ['Paint trim', 'Paint walls', 'Paint doors'],
        length: 1,
        assignedTo: [['Bob', 'Sara']]
      },
      {
        name: 'Replace furniture',
        dependsOn: ['Paint trim', 'Paint walls', 'Paint doors'],
        length: 0.5,
        assignedTo: [['Bob', 'Sara']]
      },
      {
        name: 'Install doors',
        dependsOn: ['Paint doors', 'Paint trim', 'Paint walls'],
        length: 0.5,
        assignedTo: ['Bob', 'Sara']
      }
    ];

    // Step 2: Define our resources
    var people = [
      {
        name: 'Bob',
        // Bob likes to sleep in a bit on the weekends
        availability: 'every weekend after 10:00am and before 6:00pm'
      },
      {
        name: 'Sara',
        // Sara has plans Saturday afternoon so we note that in her availability
        availability: 'every weekend after 8:00am and before 6:00pm except on Sat after 1:00pm and before 4:00pm'
      }
    ];

    // Step 3: Tasks aren't in the right format, need to create a generator
    var t = schedule.tasks()
              .id(function(d) { return d.name; })
              // our length is in hours, convert to minutes
              .duration(function(d) { return d.length * 60; })
              // use later.parse.text to parse text into a usable schedule
              .available(function(d) { return d.availability ? p(d.availability) : undefined; })
              // convert minSchedule to hours
              .minSchedule(function(d) { return d.minSchedule ? d.minSchedule * 60 : undefined; })
              // resources are the people the tasks have been assigned to
              .resources(function(d) { return d.assignedTo; });

    var tasks = t(workItems);

    // Step 4: Resources aren't in the right format, need to create a generator
    var r = schedule.resources()
              .id(function(d) { return d.name; })
              .available(function(d) { return d.availability ? p(d.availability) : undefined; });

    var resources = r(people);

    // Step 5: Pick a start date for the schedule and set correct timezone
    var start = new Date(2013, 2, 21);
    schedule.date.localTime();

    // Step 6: Create the schedule
    var s = schedule.create(tasks, resources, null, start);

    s.should.eql(
      { scheduledTasks:
         { 'Purchase supplies':
            { schedule:
               [ { resources: [ 'Bob', 'Sara' ],
                   start: 1364058000000,
                   end: 1364065200000,
                   duration: 120,
                   success: true,
                   delays:
                    { '_taskPurchase supplies': { needed: 1363849200000, available: 1363878000000 },
                      Bob: { needed: 1363849200000, available: 1364058000000 },
                      Sara: { needed: 1363849200000, available: 1364050800000 } } } ],
              duration: 120,
              earlyStart: 1364058000000,
              earlyFinish: 1364065200000,
              lateFinish: 1364067000000,
              floatAmt: 30 },
           'Clear furniture':
            { schedule:
               [ { resources: [ 'Sara' ],
                   start: 1364050800000,
                   end: 1364054400000,
                   duration: 60,
                   success: true,
                   delays: { Sara: { needed: 1363849200000, available: 1364050800000 } } } ],
              duration: 60,
              earlyStart: 1364050800000,
              earlyFinish: 1364054400000,
              lateFinish: 1364067000000,
              floatAmt: 210 },
           'Remove doors':
            { schedule:
               [ { resources: [ 'Bob' ],
                   start: 1364065200000,
                   end: 1364067000000,
                   duration: 30,
                   success: true,
                   delays: { Bob: { needed: 1363849200000, available: 1364065200000 } } } ],
              duration: 30,
              earlyStart: 1364065200000,
              earlyFinish: 1364067000000,
              lateFinish: 1364067000000,
              floatAmt: 0 },
           'Protect carpet':
            { schedule:
               [ { resources: [ 'Bob' ],
                   start: 1364067000000,
                   end: 1364074200000,
                   duration: 120,
                   success: true,
                   delays: {} } ],
              duration: 120,
              earlyStart: 1364067000000,
              earlyFinish: 1364074200000,
              lateFinish: 1364074200000,
              floatAmt: 0 },
           'Paint walls':
            { schedule:
               [ { resources: [ 'Bob' ],
                   start: 1364074200000,
                   end: 1364086800000,
                   duration: 210,
                   success: true,
                   delays: { Sara: { needed: 1364074200000, available: 1364079600000 } } },
                 { resources: [ 'Sara' ],
                   start: 1364137200000,
                   end: 1364142600000,
                   duration: 90,
                   success: true,
                   delays: { Sara: { needed: 1364086800000, available: 1364137200000 } } } ],
              duration: 300,
              earlyStart: 1364074200000,
              earlyFinish: 1364142600000,
              lateFinish: 1364155200000,
              floatAmt: 210 },
           'Paint trim':
            { schedule:
               [ { resources: [ 'Sara' ],
                   start: 1364079600000,
                   end: 1364086800000,
                   duration: 120,
                   success: true,
                   delays: { Sara: { needed: 1364074200000, available: 1364079600000 } } },
                 { resources: [ 'Sara' ],
                   start: 1364142600000,
                   end: 1364146200000,
                   duration: 60,
                   success: true,
                   delays: { Sara: { needed: 1364086800000, available: 1364142600000 } } } ],
              duration: 180,
              earlyStart: 1364079600000,
              earlyFinish: 1364146200000,
              lateFinish: 1364155200000,
              floatAmt: 150 },
           'Paint doors':
            { schedule:
               [ { resources: [ 'Bob' ],
                   start: 1364144400000,
                   end: 1364151600000,
                   duration: 120,
                   success: true,
                   delays: { Bob: { needed: 1364074200000, available: 1364144400000 } } } ],
              duration: 120,
              earlyStart: 1364144400000,
              earlyFinish: 1364151600000,
              lateFinish: 1364155200000,
              floatAmt: 60 },
           Cleanup:
            { schedule:
               [ { resources: [ 'Bob' ],
                   start: 1364151600000,
                   end: 1364155200000,
                   duration: 60,
                   success: true,
                   delays: {} } ],
              duration: 60,
              earlyStart: 1364151600000,
              earlyFinish: 1364155200000,
              lateFinish: 1364157000000,
              floatAmt: 30 },
           'Install doors':
            { schedule:
               [ { resources: [ 'Bob', 'Sara' ],
                   start: 1364155200000,
                   end: 1364157000000,
                   duration: 30,
                   success: true,
                   delays: { Bob: { needed: 1364151600000, available: 1364155200000 } } } ],
              duration: 30,
              earlyStart: 1364155200000,
              earlyFinish: 1364157000000,
              lateFinish: 1364157000000,
              floatAmt: 0 },
           'Replace furniture':
            { schedule:
               [ { resources: [ 'Sara' ],
                   start: 1364151600000,
                   end: 1364153400000,
                   duration: 30,
                   success: true,
                   delays: { Bob: { needed: 1364151600000, available: 1364157000000 } } } ],
              duration: 30,
              earlyStart: 1364151600000,
              earlyFinish: 1364153400000,
              lateFinish: 1364157000000,
              floatAmt: 60 } },
        failedTasks: null,
        success: true,
        start: 1364050800000,
        end: 1364157000000 }
    );

  });

});