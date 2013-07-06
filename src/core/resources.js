

schedule.resources = function(resourceArr) {
  var id = resourcesId,
      sched = resourcesSched,
      isNotReservable = resourcesIsNotReservable;

  function resources() {
    var map = {},
        fid = schedule.functor(id),
        fsched = schedule.functor(sched),
        freserve = schedule.functor(isNotReservable);

    for(var i = 0, len = resourceArr.length; i < len; i++) {
      var resource = resourceArr[i],
          rId = fid.call(this, resource, i),
          rSched = fsched.call(this, resource, i),
          rReserve = freserve.call(this, resource, i);

      map[rId] = {id: rId, schedule: rSched, isNotReservable: rReserve};
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

  resources.isNotReservable = function(_) {
    if (!arguments.length) return isNotReservable;
    isNotReservable = _;
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

function resourcesIsNotReservable(d) {
  return d.isNotReservable || false;
}