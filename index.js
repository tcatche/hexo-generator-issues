
'use strict';

hexo.extend.generator.register('issues', async function(locals) {
  require('./dist/generator')(this, locals);
});

hexo.extend.deployer.register('issues', async function() {
  require('./dist/deployer')(this);
});
