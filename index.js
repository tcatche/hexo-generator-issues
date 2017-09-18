'use strict';

// hexo.extend.generator.register('issue', require('./dist/generator'));

hexo.extend.filter.register('before_post_render', require('./dist/filter'));

