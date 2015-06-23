## This code is no longer being actively maintained. It should not be used in production. It may or may not work for your particular use case. ###

# [Schedule v0.6.2](http://bunkat.github.io/schedule/) [![Build Status](https://travis-ci.org/bunkat/schedule.png)](https://travis-ci.org/bunkat/schedule)

_Schedule_ is a library for scheduling a set of tasks with complex dependencies that require a set of resources to complete. Takes advantage of [Later](http://bunkat.github.io/later/) schedules to provide incredible flexibility on when tasks are scheduled and when resources can be reserved.

Types of schedules supported by _Schedule_:

* Schedule a set of work items across developers with different schedules
* Manage elevator reservations for an apartment building
* Schedule the company ping pong tournment

####For complete documentation visit [http://bunkat.github.io/schedule/](http://bunkat.github.io/schedule/).


## Installation
Using npm:

    $ npm install schedulejs

Using bower:

    $ bower install later
    $ bower install schedule

## Building

To build the minified javascript files for _schedule_, run `npm install` to install dependencies and then:

    $ make build

## Running tests

To run the tests for _schedule_, run `npm install` to install dependencies and then:

    $ make test

## Versioning

Releases will be numbered with the following format:

`<major>.<minor>.<patch>`

And constructed with the following guidelines:

* Breaking backward compatibility bumps the major (and resets the minor and patch)
* New additions without breaking backward compatibility bumps the minor (and resets the patch)
* Bug fixes and misc changes bumps the patch

For more information on SemVer, please visit [http://semver.org/](http://semver.org/).

## Bug tracker

Have a bug or a feature request? [Please open a new issue](https://github.com/bunkat/schedule/issues).

## Change Log

### Schedule v0.6.0

* First documented release.
