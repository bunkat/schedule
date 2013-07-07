var schedule = require('../../index'),
    should = require('should'),
    util = require('util');

describe('Dependency Graph', function() {

  describe('tasks', function() {
    var tasks = [
          {id: 'A', duration: 1},
          {id: 'B', duration: 3, dependsOn: ['A'] },
          {id: 'C', duration: 2, dependsOn: ['A'] },
          {id: 'D', duration: 2, dependsOn: ['C'] }
        ],
        graph = schedule.dependencyGraph(tasks);

    it('should return tasks in the tasks property', function() {
      should.exist(graph.tasks.A);
      should.exist(graph.tasks.B);
      should.exist(graph.tasks.C);
      should.exist(graph.tasks.D);
    });

    it('should maintain the duration value', function() {
      graph.tasks.A.duration.should.eql(1);
      graph.tasks.B.duration.should.eql(3);
      graph.tasks.C.duration.should.eql(2);
      graph.tasks.D.duration.should.eql(2);
    });

    it('should set requiredBy field', function() {
      graph.tasks.A.requiredBy.should.eql(['B', 'C']);
      should.not.exist(graph.tasks.B.requiredBy);
      graph.tasks.C.requiredBy.should.eql(['D']);
      should.not.exist(graph.tasks.D.requiredBy);
    });

    it('should set maximum depth of dependencies', function() {
      graph.tasks.A.depth.should.eql(2);
      graph.tasks.B.depth.should.eql(0);
      graph.tasks.C.depth.should.eql(1);
      graph.tasks.D.depth.should.eql(0);
    });

    it('should set earliest start date', function() {
      graph.tasks.A.earlyStart.should.eql(0);
      graph.tasks.B.earlyStart.should.eql(1);
      graph.tasks.C.earlyStart.should.eql(1);
      graph.tasks.D.earlyStart.should.eql(3);
    });

    it('should set earliest end date', function() {
      graph.tasks.A.earlyFinish.should.eql(1);
      graph.tasks.B.earlyFinish.should.eql(4);
      graph.tasks.C.earlyFinish.should.eql(3);
      graph.tasks.D.earlyFinish.should.eql(5);
    });

    it('should set latest start date', function() {
      graph.tasks.A.lateStart.should.eql(0);
      graph.tasks.B.lateStart.should.eql(2);
      graph.tasks.C.lateStart.should.eql(1);
      graph.tasks.D.lateStart.should.eql(3);
    });

    it('should set latest end date', function() {
      graph.tasks.A.lateFinish.should.eql(1);
      graph.tasks.B.lateFinish.should.eql(5);
      graph.tasks.C.lateFinish.should.eql(3);
      graph.tasks.D.lateFinish.should.eql(5);
    });

    it('should set float amount', function() {
      graph.tasks.A.floatAmt.should.eql(0);
      graph.tasks.B.floatAmt.should.eql(1);
      graph.tasks.C.floatAmt.should.eql(0);
      graph.tasks.D.floatAmt.should.eql(0);
    });

    it('should set graph end', function() {
      graph.end.should.eql(5);
    });

  });

  describe('roots', function() {

    it('should return a single task as the root node', function() {
      var tasks = [
            {id: 'A', duration: 1}
          ],
          graph = schedule.dependencyGraph(tasks);

      graph.roots.should.eql(['A']);
    });

    it('should return multiple root nodes', function() {
      var tasks = [
            {id: 'A', duration: 1},
            {id: 'B', duration: 1}
          ],
          graph = schedule.dependencyGraph(tasks);

      graph.roots.should.eql(['A', 'B']);
    });

    it('should not return nodes with dependencies as root nodes', function() {
      var tasks = [
            {id: 'A', duration: 1},
            {id: 'B', duration: 1},
            {id: 'C', duration: 1, dependsOn: ['A']}
          ],
          graph = schedule.dependencyGraph(tasks);

      graph.roots.should.eql(['A', 'B']);
    });

  });

  describe('leaves', function() {

    it('should return a single task as the leaf node', function() {
      var tasks = [
            {id: 'A', duration: 1}
          ],
          graph = schedule.dependencyGraph(tasks);

      graph.leaves.should.eql(['A']);
    });

    it('should return multiple leaf nodes', function() {
      var tasks = [
            {id: 'A', duration: 1},
            {id: 'B', duration: 1, dependsOn: ['A']},
            {id: 'C', duration: 1, dependsOn: ['A']}
          ],
          graph = schedule.dependencyGraph(tasks);

      graph.leaves.should.eql(['B', 'C']);
    });

    it('should not return intermediate nodes as leaf nodes', function() {
      var tasks = [
            {id: 'A', duration: 1},
            {id: 'B', duration: 1, dependsOn: ['A']},
            {id: 'C', duration: 1, dependsOn: ['B']}
          ],
          graph = schedule.dependencyGraph(tasks);

      graph.leaves.should.eql(['C']);
    });

  });

  describe('depth', function() {

    it('should return 1 for a single task', function() {
      var tasks = [
            {id: 'A', duration: 1}
          ],
          graph = schedule.dependencyGraph(tasks);

      graph.depth.should.eql(1);
    });

    it('should return 2 for a task with a dependency', function() {
      var tasks = [
            {id: 'A', duration: 1},
            {id: 'B', duration: 1, dependsOn: ['A']},
            {id: 'C', duration: 1, dependsOn: ['A']}
          ],
          graph = schedule.dependencyGraph(tasks);

      graph.depth.should.eql(2);
    });

    it('should return the maximum depth path', function() {
      var tasks = [
            {id: 'A', duration: 1},
            {id: 'B', duration: 1, dependsOn: ['A']},
            {id: 'C', duration: 1, dependsOn: ['A']},
            {id: 'D', duration: 1, dependsOn: ['C']}
          ],
          graph = schedule.dependencyGraph(tasks);

      graph.depth.should.eql(3);
    });

  });

  it('full example', function() {
    var tasks = [
          {id: 'A', duration: 1},
          {id: 'B', duration: 3, dependsOn: ['A'] },
          {id: 'C', duration: 2, dependsOn: ['A'] },
          {id: 'D', duration: 4, dependsOn: ['A'] },
          {id: 'E', duration: 2, dependsOn: ['B', 'C'] },
          {id: 'F', duration: 5, dependsOn: ['C'] },
          {id: 'G', duration: 3, dependsOn: ['E'] },
          {id: 'H', duration: 6, dependsOn: ['E', 'F'] },
          {id: 'I', duration: 3, dependsOn: ['D'] },
          {id: 'J', duration: 3, dependsOn: ['G','H','I'] }
        ],
        graph = schedule.dependencyGraph(tasks);

    graph.should.eql(
      { tasks:
       { A:
          { id: 'A',
            duration: 1,
            priority: undefined,
            schedule: undefined,
            minSchedule: undefined,
            dependsOn: undefined,
            resources: undefined,
            requiredBy: [ 'B', 'C', 'D' ],
            depth: 4,
            earlyStart: 0,
            earlyFinish: 1,
            lateStart: 0,
            lateFinish: 1,
            floatAmt: 0 },
         B:
          { id: 'B',
            duration: 3,
            priority: undefined,
            schedule: undefined,
            minSchedule: undefined,
            dependsOn: [ 'A' ],
            resources: undefined,
            requiredBy: [ 'E' ],
            depth: 3,
            earlyStart: 1,
            earlyFinish: 4,
            lateStart: 3,
            lateFinish: 6,
            floatAmt: 2 },
         C:
          { id: 'C',
            duration: 2,
            priority: undefined,
            schedule: undefined,
            minSchedule: undefined,
            dependsOn: [ 'A' ],
            resources: undefined,
            requiredBy: [ 'E', 'F' ],
            depth: 3,
            earlyStart: 1,
            earlyFinish: 3,
            lateStart: 1,
            lateFinish: 3,
            floatAmt: 0 },
         D:
          { id: 'D',
            duration: 4,
            priority: undefined,
            schedule: undefined,
            minSchedule: undefined,
            dependsOn: [ 'A' ],
            resources: undefined,
            requiredBy: [ 'I' ],
            depth: 2,
            earlyStart: 1,
            earlyFinish: 5,
            lateStart: 7,
            lateFinish: 11,
            floatAmt: 6 },
         E:
          { id: 'E',
            duration: 2,
            priority: undefined,
            schedule: undefined,
            minSchedule: undefined,
            dependsOn: [ 'B', 'C' ],
            resources: undefined,
            requiredBy: [ 'G', 'H' ],
            depth: 2,
            earlyStart: 4,
            earlyFinish: 6,
            lateStart: 6,
            lateFinish: 8,
            floatAmt: 2 },
         F:
          { id: 'F',
            duration: 5,
            priority: undefined,
            schedule: undefined,
            minSchedule: undefined,
            dependsOn: [ 'C' ],
            resources: undefined,
            requiredBy: [ 'H' ],
            depth: 2,
            earlyStart: 3,
            earlyFinish: 8,
            lateStart: 3,
            lateFinish: 8,
            floatAmt: 0 },
         G:
          { id: 'G',
            duration: 3,
            priority: undefined,
            schedule: undefined,
            minSchedule: undefined,
            dependsOn: [ 'E' ],
            resources: undefined,
            requiredBy: [ 'J' ],
            depth: 1,
            earlyStart: 6,
            earlyFinish: 9,
            lateStart: 11,
            lateFinish: 14,
            floatAmt: 5 },
         H:
          { id: 'H',
            duration: 6,
            priority: undefined,
            schedule: undefined,
            minSchedule: undefined,
            dependsOn: [ 'E', 'F' ],
            resources: undefined,
            requiredBy: [ 'J' ],
            depth: 1,
            earlyStart: 8,
            earlyFinish: 14,
            lateStart: 8,
            lateFinish: 14,
            floatAmt: 0 },
         I:
          { id: 'I',
            duration: 3,
            priority: undefined,
            schedule: undefined,
            minSchedule: undefined,
            dependsOn: [ 'D' ],
            resources: undefined,
            requiredBy: [ 'J' ],
            depth: 1,
            earlyStart: 5,
            earlyFinish: 8,
            lateStart: 11,
            lateFinish: 14,
            floatAmt: 6 },
         J:
          { id: 'J',
            duration: 3,
            priority: undefined,
            schedule: undefined,
            minSchedule: undefined,
            dependsOn: [ 'G', 'H', 'I' ],
            resources: undefined,
            depth: 0,
            earlyStart: 14,
            earlyFinish: 17,
            lateStart: 14,
            lateFinish: 17,
            floatAmt: 0 } },
      roots: [ 'A' ],
      leaves: [ 'J' ],
      resources: [],
      depth: 5,
      end: 17
      });

    });
});