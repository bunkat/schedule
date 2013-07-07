var Benchmark = require('benchmark'),
    suite = new Benchmark.Suite('dependency-graph');

global.schedule = require('../index');

suite
.add('create dependency graph', function() {
  schedule.dependencyGraph(tasks);
},
{
  'setup': function() {
    var tasks = [
          {id: 'A', duration: 480},
          {id: 'B', duration: 240, dependsOn: ['A'] },
          {id: 'C', duration: 120, dependsOn: ['A'] },
          {id: 'D', duration: 360, dependsOn: ['A'] },
          {id: 'E', duration: 120, dependsOn: ['B', 'C'] },
          {id: 'F', duration: 420, dependsOn: ['C'] },
          {id: 'G', duration: 240, dependsOn: ['E'] },
          {id: 'H', duration: 480, dependsOn: ['E', 'F'] },
          {id: 'I', duration: 240, dependsOn: ['D'] },
          {id: 'J', duration: 240, dependsOn: ['G','H','I'] }
        ];
    }
})
.on('error', function(event) {
  console.log(event);
})
.on('cycle', function(event) {
  console.log(String(event.target));
})
.run({async: false});