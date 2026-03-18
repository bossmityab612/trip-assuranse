const gulp = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const cleanCSS = require('gulp-clean-css');
const autoprefixer = require('gulp-autoprefixer');
const groupCssMediaQueries = require('gulp-group-css-media-queries');

const { src, dest, watch, series, parallel } = require('gulp');
const plumber = require('gulp-plumber');
const sourcemaps = require('gulp-sourcemaps');
const notify = require('gulp-notify');
const browserSync = require('browser-sync').create();
const { deleteAsync } = require('del');

// Дополнительные плагины для JS (нужно установить)
const uglify = require('gulp-uglify');        // для минификации
const rename = require('gulp-rename');        // для переименования файлов
const babel = require('gulp-babel');          // для транспиляции ES6+

// Пути
const paths = {
  src: {
    html: 'src/*.html',
    htmlIncludes: 'src/html/**/*.html',
    scss: 'src/scss/**/*.scss',
    js: 'src/js/**/*.js',                 // исходники JS
    images: 'src/images/**/*.{jpg,jpeg,png,gif,svg,webp}',
    fonts: 'src/fonts/**/*'
  },
  public: {
    base: 'public/',
    css: 'public/css/',
    js: 'public/js/',                      // папка для готовых JS
    images: 'public/images/',
    fonts: 'public/fonts/'
  }
};

// Обработка ошибок (твой код)
const handleError = function (err) {
  notify.onError({
    title: "Gulp error",
    message: "<%= error.message %>",
    sound: "Beep"
  })(err);
  this.emit('end');
};

// === Обработка JavaScript ===
function scripts() {
  return src(paths.src.js)                    // берем все JS файлы из src/js/
    .pipe(plumber({ errorHandler: handleError })) // ловим ошибки
    .pipe(sourcemaps.init())                 // начинаем карту кода

    // Транспиляция ES6+ в ES5 (совместимость со старыми браузерами)
    .pipe(babel({
      presets: ['@babel/env']
    }))

    // Минификация (сжатие кода)
    .pipe(uglify())

    // Сохраняем обычную версию (если нужно)
    .pipe(rename({ suffix: '.min' }))        // добавляем .min к имени

    .pipe(sourcemaps.write('.'))              // записываем sourcemaps

    // Выгружаем в папку public/js/
    .pipe(dest(paths.public.js))

    // Обновляем браузер
    .pipe(browserSync.stream());
}

// === Обработка JavaScript (без минификации для разработки) ===
function scriptsDev() {
  return src(paths.src.js)
    .pipe(plumber({ errorHandler: handleError }))
    .pipe(sourcemaps.init())
    .pipe(babel({
      presets: ['@babel/env']
    }))
    // Пропускаем uglify для разработки (легче дебажить)
    .pipe(sourcemaps.write('.'))
    .pipe(dest(paths.public.js))
    .pipe(browserSync.stream());
}

// Таска для HTML (пример)
function html() {
  return src(paths.src.html)
    .pipe(plumber({ errorHandler: handleError }))
    .pipe(dest(paths.public.base))
    .pipe(browserSync.stream());
}

// Таска для SCSS (если есть)
// Таска для обработки SCSS в CSS
function styles() {
  return src(paths.src.scss)                    // берем все SCSS файлы
    .pipe(plumber({ errorHandler: handleError })) // ловим ошибки
    .pipe(sourcemaps.init())                   // начинаем карту кода

    // Компилируем SCSS в CSS
    .pipe(sass({
      outputStyle: 'expanded'  // 'expanded' для разработки, 'compressed' для продакшена
    }).on('error', sass.logError))

    // Группируем медиа-запросы (опционально)
    .pipe(groupCssMediaQueries())

    // Добавляем вендорные префиксы (для поддержки старых браузеров)
    .pipe(autoprefixer({
      cascade: false
    }))

    // Минифицируем CSS для продакшена
    .pipe(cleanCSS({
      level: 2  // максимальная минификация
    }))

    // Переименовываем с суффиксом .min
    .pipe(rename({ suffix: '.min' }))

    .pipe(sourcemaps.write('.'))                // записываем sourcemaps

    // Выгружаем в public/css/
    .pipe(dest(paths.public.css))

    // Обновляем браузер
    .pipe(browserSync.stream());
}

// Версия для разработки (без минификации, легче дебажить)
function stylesDev() {
  return src(paths.src.scss)
    .pipe(plumber({ errorHandler: handleError }))
    .pipe(sourcemaps.init())
    .pipe(sass({
      outputStyle: 'expanded'  // развернутый CSS для читаемости
    }).on('error', sass.logError))
    .pipe(groupCssMediaQueries())
    .pipe(autoprefixer({
      cascade: false
    }))
    // Пропускаем cleanCSS для разработки
    .pipe(rename({ suffix: '.min' }))  // все равно добавляем .min для соответствия HTML
    .pipe(sourcemaps.write('.'))
    .pipe(dest(paths.public.css))
    .pipe(browserSync.stream());
}

// Очистка папки public
async function clean() {
  return await deleteAsync(paths.public.base);
}

// Слежение за файлами
function watchFiles() {
  watch(paths.src.html, html);
  watch(paths.src.scss, styles);
  watch(paths.src.js, scriptsDev);  // при разработке используем scriptsDev
  watch(paths.src.images, images);
  watch(paths.src.fonts, fonts);
}

// Таска для images 
function images() {
  return gulp.src('./src/images/**/*', { 
    encoding: false 
  })
  .pipe(gulp.dest('./public/images/'))
}

// Таска для fonts (пример)
function fonts() {
  return src(paths.src.fonts)
    .pipe(dest(paths.public.fonts));
}

// Сервер
function serve() {
  browserSync.init({
    server: {
      baseDir: paths.public.base  // вот она - корневая папка!
    },
    port: 3000,
    notify: false
  });
}

// Сборка для продакшна (с минификацией)
const build = series(
  clean,
  parallel(html, styles, scripts, images, fonts)
);

// Сборка для разработки (без минификации JS)
const dev = series(
  clean,
  parallel(html, styles, scriptsDev, images, fonts),
  parallel(serve, watchFiles)
);

// Экспортируем таски
exports.scripts = scripts;
exports.images = images;
exports.scriptsDev = scriptsDev;
exports.clean = clean;
exports.build = build;
exports.dev = dev;
exports.default = dev;  // по умолчанию запускается dev