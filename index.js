var globals = ["document", "window", "schedule"],
    globalValues = {};

globals.forEach(function(g) {
  if (g in global) globalValues[g] = global[g];
});

require(process.env['SCHEDULE_COV'] ? "./schedule-cov" : "./schedule");

module.exports = schedule;

globals.forEach(function(g) {
  if (g in globalValues) global[g] = globalValues[g];
  else delete global[g];
});