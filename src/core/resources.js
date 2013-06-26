

schedule.resources = function(resourceArr) {
  var id = resourcesId,
      sched = resourcesSched;

  function resources() {
    var map = {},
        fid = schedule.functor(id),
        fsched = schedule.functor(sched);

    for(var i = 0, len = resourceArr.length; i < len; i++) {
      var resource = resourceArr[i],
          rId = fid.call(this, resource, i),
          rSched = fsched.call(this, resource, i);

      map[rId] = {id: rId, schedule: rSched};
    }

    return map;
  }

  resources.id = function(_) {
    if (!arguments.length) return id;
    id = _;
    return resources;
  };


  resources.schedule = function(_) {
    if (!arguments.length) return sched;
    sched = _;
    return resources;
  };

  return resources;
};

function resourcesId(d) {
  return d.id;
}

function resourcesSched(d) {
  return d.schedule;
}