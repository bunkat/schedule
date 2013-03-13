
SOURCE = lib/*.js
TESTS = test/*.js
REPORTER = spec

build:
		cat $(SOURCE) > schedule.js
		./node_modules/.bin/uglifyjs schedule.js -o schedule.min.js

test:
		@NODE_ENV=test ./node_modules/.bin/mocha \
				--require should \
				--reporter $(REPORTER) \
				$(TESTS)

lint:
		find lib/. -name "*.js" -print0 | xargs -0 ./node_modules/.bin/jslint \
				--white --vars --plusplus --continue

.PHONY:	build test lint