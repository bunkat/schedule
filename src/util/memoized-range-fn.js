/**
* MemoizedRangeFn
* (c) 2013 Bill, BunKat LLC.
*
* Wraps later.schedule().nextRange to provide memoization of results. Calculating
* valid occurrences can be expensive and so we want to reduce the amount of times
* we calculate them as much as possible. Also cleans up undefined values so that
* we don't have to deal with them later.
*
* Schedule is freely distributable under the MIT license.
* For all details and documentation:
*     http://github.com/bunkat/schedule
*/

schedule.memoizedRangeFn = function(fn) {
  var cache = {}; // local store for memoization results

  return function(start) {
    if(!cache[start]) {
      var result = fn(1, start);
      cache[start] = [
        result[0] ? result[0].getTime() : 4102444800000,// Jan 1, 2100
        result[1] ? result[1].getTime() : 4102444800000 // Jan 1, 2100
      ];
    }

    return cache[start];
  };
};