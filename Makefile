REPORTER ?= dot
TESTS ?= $(shell find test -name "*-test.js")

all: \
	schedule.js \
	schedule.min.js \
	bower.json \
	package.json

.PHONY: clean all test test-cov

test: schedule.js
	@NODE_ENV=test ./node_modules/.bin/mocha --reporter $(REPORTER) $(TESTS)

test-cov: schedule-cov.js
	@SCHEDULE_COV=1 $(MAKE) test REPORTER=html-cov > coverage.html

schedule-cov.js: schedule.js
	@rm -f $@
	@jscoverage --no-highlight src src-cov \
		--no-instrument=schedule.js \
		--no-instrument=compat/index.js \
		--no-instrument=util/index.js \
		--no-instrument=date/index.js \
		--no-instrument=core/index.js \
		--no-instrument=sort/index.js \
		--no-instrument=start.js \
		--no-instrument=end.js \
		--no-instrument=bower.js \
		--no-instrument=package.js
	node_modules/.bin/smash src-cov/schedule.js > schedule-cov.js
	@chmod a-w $@

benchmark: all
	@node benchmark/dependency-graph-bench.js
	@node benchmark/create-schedule-bench.js

schedule.js: $(shell node_modules/.bin/smash --list src/schedule.js)
	@rm -f $@
	node_modules/.bin/smash src/schedule.js | node_modules/.bin/uglifyjs - -b indent-level=2 -o $@
	@chmod a-w $@

schedule.min.js: schedule.js
	@rm -f $@
	node_modules/.bin/uglifyjs $< -c -m -o $@

bower.json: src/bower.js schedule.js
	@rm -f $@
	node src/bower.js > $@
	@chmod a-w $@

package.json: src/package.js schedule.js
	@rm -f $@
	node src/package.js > $@
	@chmod a-w $@

clean:
	rm -f schedule*.js package.json bower.json