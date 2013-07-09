/**
* Resources
* (c) 2013 Bill, BunKat LLC.
*
* Takes an array of objects and generates an array of valid schedule resources
* objects.
*
* Schedule is freely distributable under the MIT license.
* For all details and documentation:
*     http://github.com/bunkat/schedule
*/

schedule.resources = function() {
  var id = resourcesId,
      available = resourcesAvailable,
      isNotReservable = resourcesIsNotReservable;

  /**
  * Takes an array of objects and returns an array of schedule resource objects.
  */
  function resources(data) {
    var items = [],
        fid = schedule.functor(id),
        favailable = schedule.functor(available),
        freserve = schedule.functor(isNotReservable);

    for(var i = 0, len = data.length; i < len; i++) {
      var resource = data[i],
          rId = fid.call(this, resource, i),
          rAvailable = favailable.call(this, resource, i),
          rReserve = freserve.call(this, resource, i);

      items.push({id: rId, available: rAvailable, isNotReservable: rReserve});
    }

    return items;
  }

  /**
  * The function or value that should be used to generate the resource id. Sets the
  * value to the argument passed in, returns current value if no arguments are
  * passed in.
  */
  resources.id = function(_) {
    if (!arguments.length) return id;
    id = _;
    return resources;
  };

  /**
  * The function or value that should be used to generate the resource schedule. The
  * schedule must be a valid Later.js schedule. Sets the value to the argument
  * passed in, returns current value if no arguments are passed in.
  */
  resources.available = function(_) {
    if (!arguments.length) return available;
    available = _;
    return resources;
  };

  /**
  * The function or value that should be used to generate the resource is not
  * reservable value. Sets the value to the argument passed in, returns current
  * value if no arguments are passed in.
  */
  resources.isNotReservable = function(_) {
    if (!arguments.length) return isNotReservable;
    isNotReservable = _;
    return resources;
  };

  return resources;
};

/**
* The default id function.
*/
function resourcesId(d) {
  return d.id;
}

/**
* The default schedule function.
*/
function resourcesAvailable(d) {
  return d.available;
}

/**
* The default is not reservable function.
*/
function resourcesIsNotReservable(d) {
  return d.isNotReservable || false;
}