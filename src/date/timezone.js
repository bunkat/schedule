/**
* Timezone
* (c) 2013 Bill, BunKat LLC.
*
* Configures helper functions to switch between useing local time and UTC. Schedule
* uses UTC time by default.
*
* Schedule is freely distributable under the MIT license.
* For all details and documentation:
*     http://github.com/bunkat/schedule
*/

// pass through to Later to configure timezones
schedule.date.UTC = function() { later.date.UTC(); };
schedule.date.localTime = function() { later.date.localTime(); };