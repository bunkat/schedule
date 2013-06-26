var schedule = require('../../index'),
    later = require('later'),
    should = require('should'),
    util = require('util');

describe.only('Tree', function() {

  var items = [
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

  var time = process.hrtime();
  var tree = schedule.tree(items);
  var diff = process.hrtime(time);
  console.log('benchmark took %d nanoseconds', diff[0] * 1e9 + diff[1]);

  console.log(util.inspect(tree.items(), { depth: null }));
  console.log(util.inspect(tree.roots(), { depth: null }));
  console.log(util.inspect(tree.leaves(), { depth: null }));
  console.log(util.inspect(tree.depth(), { depth: null }));
  console.log(util.inspect(tree.criticalPath(), { depth: null }));






});