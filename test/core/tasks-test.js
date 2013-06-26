var schedule = require('../../index'),
    later = require('later'),
    should = require('should');

describe('Tasks', function() {

  describe('setters', function() {

    it('should support custom id function', function() {
      should.exist(schedule.tasks().id);
    });

    it('should support custom duration function', function() {
      should.exist(schedule.tasks().duration);
    });

    it('should support a custom schedule function', function() {
      should.exist(schedule.tasks().schedule);
    });

    it('should support a custom resources function', function() {
      should.exist(schedule.tasks().resources);
    });

    it('should support a custom dependsOn function', function() {
      should.exist(schedule.tasks().dependsOn);
    });

    it('should support a custom splittable function', function() {
      should.exist(schedule.tasks().splittable);
    });

  });


  describe('accessors', function() {

    it('should support default accessors', function() {



    });

  });


  describe('return tree', function() {





  });





});