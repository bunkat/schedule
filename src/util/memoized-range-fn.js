

schedule.memoizedRangeFn = function(fn) {
  var cache = {};

  return function(start) {
    if(!cache[start]) {
      var result = fn(1, start);
      cache[start] = [result[0].getTime(), result[1].getTime()];
    }

    return cache[start];
  };
};