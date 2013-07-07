var Benchmark = require('benchmark'),
    suite = new Benchmark.Suite('dependency-graph');

global.schedule = require('../index');
global.later = require('later');
global.p = later.parse.text;

suite
.add('create schedule', function() {
  schedule.create(tasks, resources, null, start);
},
{
  'setup': function() {
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
              .schedule(function(d) { return d.availability ? p(d.availability) : undefined; })
              // convert minSchedule to hours
              .minSchedule(function(d) { return d.minSchedule ? d.minSchedule * 60 : undefined; })
              // resources are the people the tasks have been assigned to
              .resources(function(d) { return d.assignedTo; });

    var tasks = t(workItems);

    // Step 4: Resources aren't in the right format, need to create a generator
    var r = schedule.resources()
              .id(function(d) { return d.name; })
              .schedule(function(d) { return d.availability ? p(d.availability) : undefined; });

    var resources = r(people);

    // Step 5: Pick a start date for the schedule and set correct timezone
    var start = new Date(2013, 2, 21);
  }
})
.on('error', function(event) {
  console.log(event);
})
.on('cycle', function(event) {
  console.log(String(event.target));
})
.run({async: false});