(function() {

    var setupTeardown = function(fixtureId) {
        var fixture = document.getElementById(fixtureId);
        var markup  = fixture.innerHTML;

        QUnit.testStart(
            /**
             * @param {Object} details
             * @param {String} details.name   Name of the next test to run.
             * @param {String} details.module Name of the current module.
             */
            function(details) {
                fixture.innerHTML = markup;
            }
        );

        QUnit.testDone(
            /**
             * @param {Object} details
             * @param {String} details.name     Name of the next test to run.
             * @param {String} details.module   Name of the current module.
             * @param {Number} details.failed   The number of failed assertions.
             * @param {Number} details.passed   The number of passed assertions.
             * @param {Number} details.total    The total number of assertions.
             * @param {Number} details.duration The total runtime, including setup and teardown.
             */
            function(details) {
                fixture.innerHTML = markup;
            }
        );
    };

    // QUnit will reset the elements inside the #qunit-fixture element after each test,
    // removing any events that may have existed. As long as you use elements only within
    // this fixture, you don't have to manually clean up after your tests to keep them atomic.
    //   - http://qunitjs.com/cookbook/#keeping-tests-atomic
    setupTeardown('d-fixture');

}());
