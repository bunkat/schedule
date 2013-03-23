
SOURCE = lib/*.js
TESTS = test/*-test.js
PERF = test/*-perf.js
REPORTER = spec

build:
		cat ./node_modules/later/later-recur.js $(SOURCE) > schedule.js
		./node_modules/.bin/uglifyjs schedule.js -o schedule.min.js -m -c

test:
		@NODE_ENV=test ./node_modules/.bin/mocha \
				--require should \
				--reporter $(REPORTER) \
				$(TESTS)

perf:
		@NODE_ENV=test ./node_modules/.bin/mocha \
				--require should \
				--reporter $(REPORTER) \
				$(PERF)

lint:
		find lib/. -name "*.js" -print0 | xargs -0 ./node_modules/.bin/jslint \
				--white --vars --plusplus --continue

.PHONY:	build test perf lint