var schedule = require("../index");

console.log(JSON.stringify({
  "name": "schedulejs",
  "version": schedule.version,
  "description": "Schedule tasks, meetings, appointments, etc",
  "keywords": ["schedule", "task", "appointment", "meeting", "event"],
  "author": "BunKat <bill@bunkat.com>",
  "repository" : {
    "type" : "git",
    "url" : "git://github.com/bunkat/schedule.git"
  },
  "main": "index.js",
  "browserify": "index-browserify.js",
  "jam": {
    "main": "schedule.js",
    "shim": {
      "exports": "schedule"
    }
  },
  "dependencies": {
    "later": ">=1.1.2"
  },
  "devDependencies": {
    "smash": "~0.0.8",
    "mocha": "*",
    "should": ">=0.6.3",
    "jslint": "*",
    "uglify-js": "*",
    "benchmark": "*"
  },
  "scripts": {
    "test": "./node_modules/.bin/mocha test/**/*-test.js"
  }
}, null, 2));