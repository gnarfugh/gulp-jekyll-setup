var gulp      = require('gulp'),
  browserSync = require('browser-sync'),
  sass        = require('gulp-sass'),
  nano        = require('gulp-cssnano'),
  rename      = require('gulp-rename'),
  prefix      = require('gulp-autoprefixer'),
  cp          = require('child_process'),
  concat      = require('gulp-concat'),
  uglify      = require('gulp-uglify'),
  deploy      = require('gulp-gh-pages'),
  del         = require('del'),
  imagemin    = require('gulp-imagemin'),
  jekyll      = process.platform === 'win32' ? 'jekyll.bat' : 'jekyll',
  messages    = { jekyllBuild: '<span style="color: white">Running:</span> jekyll build' };

gulp.task('clean', function() {
  return del([
    'css/main.min.css',
    'js/app.min.js',
    '_site/images'
  ]);
});

//Build the Jekyll Site
gulp.task('jekyll-build', ['sass', 'js', 'images'], function(done) {
  browserSync.notify(messages.jekyllBuild);
  return cp.spawn(jekyll, ['build'], { stdio: 'inherit' })
    .on('close', done);
});

//Rebuild Jekyll
gulp.task('jekyll-rebuild', ['jekyll-build'], function() {
  browserSync.reload();
});

// Wait for jekyll-build, then launch the Server
gulp.task('browser-sync', ['jekyll-build'], function() {
  browserSync({
    server: {
      baseDir: '_site'
    },
    host: "localhost"
  });
});

//Compile files from _scss into both _site/css (for live injecting) and site (for future jekyll builds)
gulp.task('sass', function() {
  return gulp.src('_scss/main.scss')
    .pipe(sass({
      includePaths: ['scss'],
      onError: browserSync.notify
    }))
    .pipe(prefix(['last 15 versions', '> 1%'], { cascade: true }))
    .pipe(gulp.dest('css'))
    .pipe(nano())
    .pipe(rename('main.min.css'))
    .pipe(gulp.dest('css'))
    .pipe(browserSync.reload({ stream: true }));
});

//concat & uglify JS files
gulp.task('js', function() {
  return gulp.src('js/*.js')
    .pipe(concat('app.js'))
    .pipe(rename('app.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('js'));
});

//images
gulp.task('images', function() {
  return gulp.src('images/*')
    .pipe(imagemin({ progressive: true }))
    .pipe(gulp.dest('_site/images'));
});

//deploy to gh-pages
gulp.task('deploy', ['jekyll-build'], function() {
  return gulp.src("./_site/**/*")
    .pipe(deploy());
});

/ Watch files for changes,recombile, run jekyll & reload BrowserSync
gulp.task('watch', ['sass'], function() {
  gulp.watch('_scss/**/*.scss', ['sass', 'jekyll-rebuild']);
  gulp.watch(['*.html', '_layouts/*.html', '_posts/*'], ['jekyll-rebuild']);
  gulp.watch('js/*.js', ['js', 'jekyll-rebuild']);
  gulp.watch('images/*', ['images', 'jekyll-rebuild']);
});

//Default 'gulp' runs clean first, then starts other tasks
gulp.task('default', ['clean'], function() {
  gulp.start('sass', 'js', 'images', 'browser-sync', 'watch');
});
