const { src, dest, series, parallel, watch } = require('gulp');

// Плагины
const sass = require('gulp-sass')(require('sass'));
const autoprefixer = require('gulp-autoprefixer');
const cleanCSS = require('gulp-clean-css');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const imagemin = require('gulp-imagemin');
const fileInclude = require('gulp-file-include');
const concat = require('gulp-concat');
const rename = require('gulp-rename');
const plumber = require('gulp-plumber');
const sourcemaps = require('gulp-sourcemaps');
const notify = require('gulp-notify');
const browserSync = require('browser-sync').create();
const { deleteAsync } = require('del');

// Пути
const paths = {
  src: {
    html: 'src/*.html',
    htmlIncludes: 'src/html/**/*.html',
    scss: 'src/scss/**/*.scss',
    js: 'src/js/**/*.js',
    images: 'src/images/**/*.{jpg,jpeg,png,gif,svg,webp}',
    fonts: 'src/fonts/**/*'
  },
  public: {
    base: 'public/',
    css: 'public/css/',
    js: 'public/js/',
    images: 'public/images/',
    fonts: 'public/fonts/'
  }
};

// Обработка ошибок
const onError = (err) => {
  notify.onError({
    title: 'Gulp Error',
    message: '<%= error.message %>'
  })(err);
  this.emit('end');
};

// HTML
function html() {
  return src(paths.src.html)
    .pipe(plumber({ errorHandler: onError }))
    .pipe(fileInclude({
      prefix: '@@',
      basepath: '@file'
    }))
    .pipe(dest(paths.public.base))
    .pipe(browserSync.stream());
}

// SCSS
function scss() {
  return src('src/scss/main.scss')
    .pipe(plumber({ errorHandler: onError }))
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(autoprefixer({
      overrideBrowserslist: ['last 2 versions', '> 1%', 'ie 11'],
      grid: true
    }))
    .pipe(rename({ suffix: '.min' }))
    .pipe(cleanCSS({ compatibility: 'ie11' }))
    .pipe(sourcemaps.write('.'))
    .pipe(dest('public/css/'))  // или paths.public.css
    .pipe(browserSync.stream());
}

// JavaScript
function js() {
  return src(paths.src.js)
    .pipe(plumber({ errorHandler: onError }))
    .pipe(sourcemaps.init())
    .pipe(babel({
      presets: ['@babel/env']
    }))
    .pipe(concat('main.js'))
    .pipe(rename({ suffix: '.min' }))
    .pipe(uglify())
    .pipe(sourcemaps.write('.'))
    .pipe(dest(paths.public.js))
    .pipe(browserSync.stream());
}

// Images
function images() {
  return src(paths.src.images)
    .pipe(plumber({ errorHandler: onError }))
    .pipe(imagemin([
      imagemin.gifsicle({ interlaced: true }),
      imagemin.mozjpeg({ quality: 75, progressive: true }),
      imagemin.optipng({ optimizationLevel: 5 }),
      imagemin.svgo({
        plugins: [
          { removeViewBox: true },
          { cleanupIDs: false }
        ]
      })
    ]))
    .pipe(dest(paths.public.images));
}

// Fonts
function fonts() {
  return src(paths.src.fonts)
    .pipe(dest(paths.public.fonts));
}

// Clean public
function clean() {
  return deleteAsync(['public/**/*', '!public/images', '!public/fonts']);
}

// Watch
function serve() {
  browserSync.init({
    server: {
      baseDir: paths.public.base
    },
    notify: false,
    open: true
  });

  watch(paths.src.html, html);
  watch(paths.src.scss, scss);
  watch(paths.src.js, js);
  watch(paths.src.images, images);
  watch(paths.src.fonts, fonts);
}

// Задачи
const build = series(clean, parallel(html, scss, js, images, fonts));
const dev = series(build, serve);

exports.html = html;
exports.scss = scss;
exports.js = js;
exports.images = images;
exports.fonts = fonts;
exports.clean = clean;
exports.build = build;
exports.dev = dev;
exports.default = dev;