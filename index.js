
'use strict';

hexo.extend.generator.register('issues', async function(locals) {
  const isDev = ['s', 'server'].includes(this.env.cmd);
  if (!isDev) {
    require('./dist/generator')(this, locals);
  }
});

hexo.extend.deployer.register('issues', async function() {
  require('./dist/deployer')(this);
});
