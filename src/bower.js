var schedule = require("../index");

console.log(JSON.stringify({
  "name": "schedule",
  "version": schedule.version,
  "main": "./schedule.js",
  "dependencies": {
      "later": "1.1.3"
    },
  "ignore": [
    "**/.*",
    "node_modules",
    "components",
    "bower_components",
    "test",
    "tests"
  ]
}, null, 2));