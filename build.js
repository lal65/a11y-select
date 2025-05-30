const fs = require('fs');

fs.mkdirSync('./dist', {recursive: true});
fs.mkdirSync('./docs', {recursive: true});
const css = fs.readFileSync('./src/a11y-select.css', 'utf8');
const CleanCSS = require('clean-css');
fs.writeFileSync('./dist/a11y-select.min.css', new CleanCSS().minify(css).styles);
fs.writeFileSync('./docs/a11y-select.min.css', new CleanCSS().minify(css).styles);

const js = fs.readFileSync('./src/a11y-select.mjs', 'utf8');
const UglifyJS = require('uglify-js');
fs.writeFileSync('./dist/a11y-select.min.mjs', UglifyJS.minify(js).code);
fs.writeFileSync('./docs/a11y-select.min.mjs', UglifyJS.minify(js).code);
