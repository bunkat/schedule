var schedule = require('../../index'),
    later = require('later'),
    should = require('should'),
    util = require('util');

describe('Schedule', function() {

  // project schedule setup
  var projSched = {schedules: [{h_a: [8], h_b: [18]}]};

  // set to use local time
  schedule.date.localTime();

  describe('forward pass with vanilla tasks', function() {

    it('should schedule a single task at first available time', function() {
      var tasks = [
            {id: 'A', duration: 100}
          ],
          startDate = new Date(2013, 2, 21);

      var s = schedule.create(tasks, [], projSched, startDate).scheduledTasks;

      s.A.earlyStart.should.eql((new Date(2013, 2, 21, 8, 0, 0)).getTime());
      s.A.earlyFinish.should.eql((new Date(2013, 2, 21, 9, 40, 0)).getTime());
      s.A.duration.should.eql(100);
    });

    it('should schedule dependent tasks after one another', function() {
      var tasks = [
            {id: 'A', duration: 100},
            {id: 'B', duration: 100, dependsOn: ['A']}
          ],
          startDate = new Date(2013, 2, 21);

      var s = schedule.create(tasks, [], projSched, startDate).scheduledTasks;

      s.A.earlyStart.should.eql((new Date(2013, 2, 21, 8, 0, 0)).getTime());
      s.A.earlyFinish.should.eql((new Date(2013, 2, 21, 9, 40, 0)).getTime());
      s.A.duration.should.eql(100);

      s.B.earlyStart.should.eql((new Date(2013, 2, 21, 9, 40, 0)).getTime());
      s.B.earlyFinish.should.eql((new Date(2013, 2, 21, 11, 20, 0)).getTime());
      s.B.duration.should.eql(100);
    });

    it('should schedule sibling tasks in parallel', function() {
      var tasks = [
            {id: 'A', duration: 100},
            {id: 'B', duration: 100, dependsOn: ['A']},
            {id: 'C', duration: 100, dependsOn: ['A']}
          ],
          startDate = new Date(2013, 2, 21);

      var s = schedule.create(tasks, [], projSched, startDate).scheduledTasks;

      s.B.earlyStart.should.eql((new Date(2013, 2, 21, 9, 40, 0)).getTime());
      s.B.earlyFinish.should.eql((new Date(2013, 2, 21, 11, 20, 0)).getTime());
      s.B.duration.should.eql(100);

      s.C.earlyStart.should.eql((new Date(2013, 2, 21, 9, 40, 0)).getTime());
      s.C.earlyFinish.should.eql((new Date(2013, 2, 21, 11, 20, 0)).getTime());
      s.C.duration.should.eql(100);
    });

    it('should wait for all dependencies to complete before scheduling dependent task', function() {
      var tasks = [
            {id: 'A', duration: 100},
            {id: 'B', duration: 100, dependsOn: ['A']},
            {id: 'C', duration: 200, dependsOn: ['A']},
            {id: 'D', duration: 100, dependsOn: ['B', 'C']}
          ],
          startDate = new Date(2013, 2, 21);

      var s = schedule.create(tasks, [], projSched, startDate).scheduledTasks;

      s.D.earlyStart.should.eql((new Date(2013, 2, 21, 13, 0, 0)).getTime());
      s.D.earlyFinish.should.eql((new Date(2013, 2, 21, 14, 40, 0)).getTime());
      s.D.duration.should.eql(100);
    });


    it('should fail to schedule tasks with circular dependencies', function() {
      var tasks = [
            {id: 'A', duration: 100},
            {id: 'B', duration: 100, dependsOn: ['A', 'C']},
            {id: 'C', duration: 200, dependsOn: ['D']},
            {id: 'D', duration: 100, dependsOn: ['B']}
          ],
          startDate = new Date(2013, 2, 21);

      var s = schedule.create(tasks, [], projSched, startDate);

      should.not.exist(s.scheduledTasks.B);
      should.not.exist(s.scheduledTasks.C);
      should.not.exist(s.scheduledTasks.D);
      s.failedTasks.length.should.eql(3);
      s.success.should.eql(false);
    });


    it('should split tasks across multiple days when needed', function() {
      var tasks = [
            {id: 'A', duration: 720}
          ],
          startDate = new Date(2013, 2, 21);

      var s = schedule.create(tasks, [], projSched, startDate).scheduledTasks;

      s.A.schedule.length.should.eql(2);
      s.A.schedule[0].duration.should.eql(600);
      s.A.schedule[1].duration.should.eql(120);
      s.A.earlyStart.should.eql((new Date(2013, 2, 21, 8, 0, 0)).getTime());
      s.A.earlyFinish.should.eql((new Date(2013, 2, 22, 10, 0, 0)).getTime());
      s.A.duration.should.eql(720);
    });

    it('should go to next range when at end of range', function() {
      var tasks = [
            {id: 'A', duration: 600},
            {id: 'B', duration: 120, dependsOn: ['A']}
          ],
          startDate = new Date(2013, 2, 21);

      var s = schedule.create(tasks, [], projSched, startDate).scheduledTasks;

      s.A.earlyStart.should.eql((new Date(2013, 2, 21, 8, 0, 0)).getTime());
      s.A.earlyFinish.should.eql((new Date(2013, 2, 21, 18, 0, 0)).getTime());
      s.A.duration.should.eql(600);

      s.B.earlyStart.should.eql((new Date(2013, 2, 22, 8, 0, 0)).getTime());
      s.B.earlyFinish.should.eql((new Date(2013, 2, 22, 10, 0, 0)).getTime());
      s.B.duration.should.eql(120);
    });
  });

  describe('backward pass with vanilla tasks', function() {

    it('should set late finish to early finish for single task', function() {
      var tasks = [
            {id: 'A', duration: 100}
          ],
          startDate = new Date(2013, 2, 21);

      var s = schedule.create(tasks, [], projSched, startDate).scheduledTasks;

      s.A.lateFinish.should.eql((new Date(2013, 2, 21, 9, 40, 0)).getTime());
    });

    it('should set late finish for dependent tasks', function() {
      var tasks = [
            {id: 'A', duration: 100},
            {id: 'B', duration: 100, dependsOn: ['A']}
          ],
          startDate = new Date(2013, 2, 21);

      var s = schedule.create(tasks, [], projSched, startDate).scheduledTasks;

      s.A.lateFinish.should.eql((new Date(2013, 2, 21, 9, 40, 0)).getTime());
      s.B.lateFinish.should.eql((new Date(2013, 2, 21, 11, 20, 0)).getTime());
    });

    it('should set late finish to latest leaf node', function() {
      var tasks = [
            {id: 'A', duration: 60},
            {id: 'B', duration: 60, dependsOn: ['A']},
            {id: 'C', duration: 120, dependsOn: ['A']},
            {id: 'D', duration: 60, dependsOn: ['C']}
          ],
          startDate = new Date(2013, 2, 21);

      var s = schedule.create(tasks, [], projSched, startDate).scheduledTasks;

      s.A.lateFinish.should.eql((new Date(2013, 2, 21, 9, 0, 0)).getTime());
      s.B.lateFinish.should.eql((new Date(2013, 2, 21, 12, 0, 0)).getTime());
      s.C.lateFinish.should.eql((new Date(2013, 2, 21, 11, 0, 0)).getTime());
      s.D.lateFinish.should.eql((new Date(2013, 2, 21, 12, 0, 0)).getTime());
    });

    it('should set float amount in minutes', function() {
      var tasks = [
            {id: 'A', duration: 60},
            {id: 'B', duration: 60, dependsOn: ['A']},
            {id: 'C', duration: 120, dependsOn: ['A']},
            {id: 'D', duration: 60, dependsOn: ['C']}
          ],
          startDate = new Date(2013, 2, 21);

      var s = schedule.create(tasks, [], projSched, startDate).scheduledTasks;

      s.A.floatAmt.should.eql(0);
      s.B.floatAmt.should.eql(120);
      s.C.floatAmt.should.eql(0);
      s.D.floatAmt.should.eql(0);
    });

  });

  describe('minimum schedule length', function() {

    it('should not schedule a task shorter than minimum schedule length', function() {
      var tasks = [
            {id: 'A', duration: 240, minSchedule: 120}
          ],
          startDate = new Date(2013, 2, 21, 17, 0, 0);

      var s = schedule.create(tasks, [], projSched, startDate).scheduledTasks;

      s.A.schedule.length.should.eql(1);
      s.A.schedule[0].duration.should.eql(240);
      s.A.earlyStart.should.eql((new Date(2013, 2, 22, 8, 0, 0)).getTime());
      s.A.earlyFinish.should.eql((new Date(2013, 2, 22, 12, 0, 0)).getTime());
      s.A.duration.should.eql(240);
    });

    it('should split tasks if minSchedule is met', function() {
      var tasks = [
            {id: 'A', duration: 240, minSchedule: 120}
          ],
          startDate = new Date(2013, 2, 21, 16, 0, 0);

      var s = schedule.create(tasks, [], projSched, startDate).scheduledTasks;

      s.A.schedule.length.should.eql(2);
      s.A.schedule[0].duration.should.eql(120);
      s.A.schedule[1].duration.should.eql(120);
      s.A.earlyStart.should.eql((new Date(2013, 2, 21, 16, 0, 0)).getTime());
      s.A.earlyFinish.should.eql((new Date(2013, 2, 22, 10, 0, 0)).getTime());
      s.A.duration.should.eql(240);
    });

  });

  describe('task priority', function() {

    it('should schedule higher priority tasks first', function() {
      var tasks = [
            {id: 'A', duration: 120, resources: ['A'], priority: 0},
            {id: 'B', duration: 120, resources: ['A'], priority: 100},
            {id: 'C', duration: 120, resources: ['A'], priority: 50}
          ],
          startDate = new Date(2013, 2, 21, 0, 0, 0);

      var s = schedule.create(tasks, [], projSched, startDate).scheduledTasks;

      s.A.earlyStart.should.eql((new Date(2013, 2, 21, 12, 0, 0)).getTime());
      s.A.earlyFinish.should.eql((new Date(2013, 2, 21, 14, 0, 0)).getTime());

      s.B.earlyStart.should.eql((new Date(2013, 2, 21, 8, 0, 0)).getTime());
      s.B.earlyFinish.should.eql((new Date(2013, 2, 21, 10, 0, 0)).getTime());

      s.C.earlyStart.should.eql((new Date(2013, 2, 21, 10, 0, 0)).getTime());
      s.C.earlyFinish.should.eql((new Date(2013, 2, 21, 12, 0, 0)).getTime());
    });

    it('should maintain dependency ordering', function() {
      var tasks = [
            {id: 'A', duration: 120, resources: ['A'], priority: 0},
            {id: 'B', duration: 120, dependsOn: ['A'], resources: ['A'], priority: 100},
            {id: 'C', duration: 120, dependsOn: ['A'], resources: ['A'], priority: 150}
          ],
          startDate = new Date(2013, 2, 21, 0, 0, 0);

      var s = schedule.create(tasks, [], projSched, startDate).scheduledTasks;

      s.A.earlyStart.should.eql((new Date(2013, 2, 21, 8, 0, 0)).getTime());
      s.A.earlyFinish.should.eql((new Date(2013, 2, 21, 10, 0, 0)).getTime());

      s.B.earlyStart.should.eql((new Date(2013, 2, 21, 12, 0, 0)).getTime());
      s.B.earlyFinish.should.eql((new Date(2013, 2, 21, 14, 0, 0)).getTime());

      s.C.earlyStart.should.eql((new Date(2013, 2, 21, 10, 0, 0)).getTime());
      s.C.earlyFinish.should.eql((new Date(2013, 2, 21, 12, 0, 0)).getTime());
    });

  });

  describe('task schedules', function() {

    it('should only schedule tasks when available', function() {
      var tasks = [
            {id: 'A', duration: 120, available: {schedules: [{h_a: [12]}]}}
          ],
          startDate = new Date(2013, 2, 21, 0, 0, 0);

      var s = schedule.create(tasks, [], projSched, startDate).scheduledTasks;

      s.A.earlyStart.should.eql((new Date(2013, 2, 21, 12, 0, 0)).getTime());
      s.A.earlyFinish.should.eql((new Date(2013, 2, 21, 14, 0, 0)).getTime());
    });

    it('should fail to schedule tasks that will never be available', function() {
      var tasks = [
            {id: 'A', duration: 120, available: {schedules: [{fd_b: [100]}]}}
          ],
          startDate = new Date(2013, 2, 21, 0, 0, 0);

      var s = schedule.create(tasks, [], projSched, startDate);

      s.failedTasks.should.eql(['A']);
      s.success.should.eql(false);
    });

    it('should fail to schedule tasks with an invalid schedule', function() {
      var tasks = [
            {id: 'A', duration: 120, available:
              {
                schedules: [{h: [5,6]}],
                exceptions: [{h: [5,6]}]
              }
            }
          ],
          startDate = new Date(2013, 2, 21, 0, 0, 0);

      var s = schedule.create(tasks, [], projSched, startDate);

      s.failedTasks.should.eql(['A']);
      s.success.should.eql(false);
    });

    it('should work if project schedule is null', function() {
      var tasks = [
            {id: 'A', duration: 120, available: {schedules: [{h_a: [12]}]}}
          ],
          startDate = new Date(2013, 2, 21, 0, 0, 0);

      var s = schedule.create(tasks, null, null, startDate).scheduledTasks;

      s.A.earlyStart.should.eql((new Date(2013, 2, 21, 12, 0, 0)).getTime());
      s.A.earlyFinish.should.eql((new Date(2013, 2, 21, 14, 0, 0)).getTime());
    });

  });

});