

schedule.memoizedRangeFn = function(fn) {
  var cache = {};

  return function(start) {
    if(!cache[start]) {
      var result = fn(1, start);
      cache[start] = [
        result[0].getTime(),
        result[1] ? result[1].getTime() : 4102444800000 // Jan 1, 2100
      ];
    }

    return cache[start];
  };
};