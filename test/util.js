

module.exports.task = function(id, lengthInHours, assignedTo) {
  return {
    id: id,
    estimatedTime: lengthInHours * 60,
    assignedTo: assignedTo
  };
};

module.exports.getTaskSchedule = function(results, task) {
  var s = results.filter(function(r) { return r.id === task.id; }),
      t = [];

  for(var i = 0, len = s.length; i < len; i++) {
    t.push([s[i].startTime, s[i].endTime]);
  }

  return t;
};

module.exports.calcSchedule = function(t, mins) {
  return [t, new Date(t.getTime() + mins * 60000)];
};

  // private functions
module.exports.randInt = function (start, stop) {
  return Math.floor(Math.random() * (stop - start) + start);
};

module.exports.randDate = function (start, stop) {
  if (!start) start = new Date(2013,0,1);
  if (!stop) stop = new Date(2013,3,31);

  return (new Date(linear(start.getTime(), stop.getTime()))).toISOString();
};
