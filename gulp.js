var gulp    = require('gulp'), 
browserSync = require('browser-sync'),
sass        = require('gulp-sass'),
nano        = require('gulp-cssnano'),
rename      = require('gulp-rename'),
prefix      = require('gulp-autoprefixer'),
cp          = require('child_process'),
concat      = require('gulp-concat'),
uglify      = require('gulp-uglify'),
del         = require('del'),
jekyll      = process.platform === 'win32' ? 'jekyll.bat' : 'jekyll',
messages    = {jekyllBuild: '<span style="color: grey">Running:</span> $ jekyll build'};

//Clean files
gulp.task('clean', function () {
  return del([
    'css/main.min.css',
    'js/app.min.js',
  ]);
});

 //Build the Jekyll Site
gulp.task('jekyll-build', ['clean', 'sass', 'js'], function (done) {
    browserSync.notify(messages.jekyllBuild);
    return cp.spawn( jekyll , ['build'], {stdio: 'inherit'})
        .on('close', done);
});

//Rebuild Jekyll & do page reload
gulp.task('jekyll-rebuild', ['jekyll-build'], function () {
});

//Wait for jekyll-build, then launch the Server
gulp.task('browser-sync', ['clean', 'sass', 'js', 'jekyll-build'], function() {
    browserSync({
        server: {
            baseDir: '_site'
        }
    });
});

//Compile files from _scss into both _site/css (for live injecting) and site (for future jekyll builds)
gulp.task('sass', ['clean'], function () {
    return gulp.src('_scss/main.scss')
        .pipe(sass({
            includePaths: ['scss'],
            onError: browserSync.notify
        }))
        .pipe(prefix(['last 15 versions', '> 1%', 'ie 8', 'ie 7'], { cascade: true }))
        .pipe(gulp.dest('css'))
        .pipe(nano())
        .pipe(rename('main.min.css'))
        .pipe(gulp.dest('css'))
        .pipe(browserSync.reload({stream:true}));
});

//concat & uglify JS files
gulp.task('js', ['clean'], function() {
    return gulp.src('js/*.js')
      .pipe(concat('app.js'))
        .pipe(rename('app.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('js'));
});

//Watch scss files for changes & recompile
//Watch html/md files, run jekyll & reload BrowserSync
//Watch js files for changes & concat+minify
gulp.task('watch',['sass'], function () {
    gulp.watch('_scss/*.scss', ['sass']);
    gulp.watch(['*.html', '_layouts/*.html', '_posts/*'], ['jekyll-rebuild']);
    gulp.watch('js/*.js', ['js']);
});

//Default task, running just `gulp` will compile the sass,
//concat js, compile the jekyll site, launch BrowserSync & watch files.
gulp.task('default', ['clean', 'watch', 'browser-sync']);
