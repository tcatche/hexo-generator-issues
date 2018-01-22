
'use strict';
const t = require('./dist/generator');
console.log(typeof t)
hexo.extend.generator.register('issue', require('./dist/generator'));

// hexo.extend.filter.register('before_post_render', require('./dist/filter'));
