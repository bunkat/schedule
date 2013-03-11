var app = require('../app');
var should = require('should');

describe('Default app', function() {

  it('should include all entry points', function() {
    should.exist(app.schedule);
  });

});