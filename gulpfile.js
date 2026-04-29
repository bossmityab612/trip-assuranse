const gulp = require("gulp");
const plumber = require("gulp-plumber");
const sourcemaps = require("gulp-sourcemaps");
const sass = require("gulp-sass")(require("sass"));
const autoprefixer = require("gulp-autoprefixer");
// const csso = require("postcss-csso");                  // пакет для минификации файлов
const browserSync = require("browser-sync").create();
const htmlmin = require("gulp-htmlmin");
const imagemin = require("gulp-imagemin");
const svgstore = require("gulp-svgstore");
const fileInclude = require("gulp-file-include");
const cleanCSS = require("gulp-clean-css");
const groupCssMediaQueries = require("gulp-group-css-media-queries");

const { src, dest, watch, series, parallel } = require("gulp");
// const notify = require("gulp-notify");
const { default: webp } = require("gulp-webp");
const { deleteAsync } = require("del");

// Дополнительные плагины для JS
const uglify = require("gulp-uglify");        // для минификации
const rename = require("gulp-rename");        // для переименования файлов
const babel = require("gulp-babel");          // для транспиляции ES6+

// Пути
const paths = {
  source: {
    html: "./source/*.html",
    styles: "./source/scss/**/*.scss",
    scripts: "./source/js/**/*.js",
    images: "./source/images/**/*",
    fonts: "./source/fonts/**/*"
  },

  build: {
    base: "./build/",
    html: "./build/",
    styles: "./build/css/",
    scripts: "./build/js/",
    images: "./build/images/",
    fonts: "./build/fonts/"
  }
};

// Обработка ошибок
function handleError(error) {
  console.log(error.toString());
  this.emit('end');
}

// Спрайты
const sprite = () => {
  return src("source/images/icons/*.svg")
    .pipe(svgstore({
      inlineSvg: true
    }))
    .pipe(rename("sprite.svg"))
    .pipe(dest("build/images"));
}

// === Обработка JavaScript ===
function scripts() {
  return src(paths.source.scripts)
    .pipe(plumber({ errorHandler: handleError }))
    .pipe(sourcemaps.init())
    .pipe(babel({
      presets: ["@babel/env"]
    }))
    .pipe(uglify())
    .pipe(rename({ suffix: ".min" }))

    .pipe(sourcemaps.write("."))
    .pipe(dest(paths.build.scripts))
    .pipe(browserSync.stream());
}

// === Обработка JavaScript (без минификации для разработки) ===
function scriptsDev() {
  return src(paths.source.scripts)
    .pipe(plumber({ errorHandler: handleError }))
    .pipe(sourcemaps.init())
    .pipe(babel({
      presets: ["@babel/env"]
    }))
    .pipe(sourcemaps.write("."))
    .pipe(dest(paths.build.scripts))
    .pipe(browserSync.stream());
}

// Таска для HTML
function html() {
  return src(paths.source.html)
    .pipe(fileInclude({
      prefix: '@@',
      basepath: './'
    }))
    .pipe(plumber({ errorHandler: handleError }))
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(dest(paths.build.base))
    .pipe(browserSync.stream());
}

// Таска для обработки SCSS в CSS
function styles() {
  return src(paths.source.styles)
    .pipe(plumber({ errorHandler: handleError }))
    .pipe(sourcemaps.init())
    .pipe(sass({
      outputStyle: "expanded"  // "expanded" для разработки, "compressed" для продакшена
    }).on("error", sass.logError))
    .pipe(groupCssMediaQueries())
    .pipe(autoprefixer({
      cascade: false
    }))
    .pipe(cleanCSS({
      level: 2
    }))
    .pipe(rename({ suffix: ".min" }))
    .pipe(sourcemaps.write("."))
    .pipe(dest(paths.build.styles))
    .pipe(browserSync.stream());
}

// Версия для разработки (без минификации, легче дебажить)
function stylesDev() {
  return src(paths.source.styles)
    .pipe(plumber({ errorHandler: handleError }))
    .pipe(sourcemaps.init())
    .pipe(sass({
      outputStyle: "expanded"  // развернутый CSS для читаемости
    }).on("error", sass.logError))
    .pipe(groupCssMediaQueries())
    .pipe(autoprefixer({
      cascade: false
    }))
    // Пропускаем cleanCSS для разработки
    .pipe(rename({ suffix: ".min" }))  // все равно добавляем .min для соответствия HTML
    .pipe(sourcemaps.write("."))
    .pipe(dest(paths.build.styles))
    .pipe(browserSync.stream());
}

// Очистка папки build
async function clean() {
  return await deleteAsync(paths.build.base);
}

// Слежение за файлами
function watchFiles() {
  watch(paths.source.html, html);
  watch(paths.source.styles, styles);
  watch(paths.source.scripts, scriptsDev);  // при разработке используем scriptsDev
  watch(paths.source.images, copyImages);
  watch(paths.source.fonts, fonts);
}

// Таска для optimizeImages
function optimizeImages() {
  return src("./source/images/**/*.{jpg,png,svg}", { encoding: false })
    .pipe(imagemin([
      imagemin.mozjpeg({ quality: 80, progressive: true }),
      imagemin.optipng({ optimizationLevel: 3 }),
      imagemin.svgo({ plugins: [{ removeViewBox: false }] })
    ]))
    .pipe(dest("./build/images/"))
}

// Таска для copyImages
function copyImages() {
  return src("./source/images/**/*.{jpg,png,svg}", { encoding: false })
    .pipe(dest("./build/images/"))
}

// Таска для WebP
function createWebp() {
  return src("source/images/**/*.{jpg,png}")
    .pipe(webp({ quality: 90 }))
    .pipe(dest("build/images"));
}

// Таска для fonts
function fonts() {
  return src("./source/fonts/**/*", { encoding: false })
    .pipe(dest("./build/fonts/"));
}

// Сервер
function serve() {
  browserSync.init({
    server: {
      baseDir: './build',
      routes: {
        '/dist': './dist'
      }
    },
    port: 3000,
    cors: true,
    notify: false,
    ui: false
  });
}

// Сборка для продакшна (с минификацией)
const build = series(
  clean,
  sprite,
  parallel(html, styles, scripts, fonts),
  optimizeImages,
  copyImages
);

// Сборка для разработки (без минификации JS)
const dev = series(
  clean,
  sprite,
  parallel(html, styles, scriptsDev, copyImages, fonts),
  parallel(serve, watchFiles)
);

// Экспортируем таски
exports.scripts = scripts;
exports.optimizeImages = optimizeImages;
exports.copyImages = copyImages;
exports.createWebp = createWebp;
exports.sprite = sprite;
exports.fonts = fonts;
exports.scriptsDev = scriptsDev;
exports.clean = clean;
exports.build = build;
exports.dev = dev;
exports.default = dev;  // по умолчанию запускается dev
