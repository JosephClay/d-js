var gulp = require('gulp'),
    bump = require('gulp-bump');

module.exports = function() {
    var bumpType = process.env.BUMP || 'patch'; // major.minor.patch

    return gulp.src('./package.json')
        .pipe(bump({ type: bumpType }))
        .pipe(gulp.dest('./'));
};
