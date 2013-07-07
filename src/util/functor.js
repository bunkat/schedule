/**
* Functor
*
* Wraps values in functions so that they can be called. Usage inspired by
* Mike Bostock in d3.
*
* Schedule is freely distributable under the MIT license.
* For all details and documentation:
*     http://github.com/bunkat/schedule
*/

schedule.functor = function(v) {
  return typeof v === "function" ? v : function() { return v; };
};