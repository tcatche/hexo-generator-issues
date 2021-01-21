const { auth, repository } = require('./locals');

const gen = require('../dist/generator');
const ctx = {
  log: {
    w: console.warn,
    i: console.info,
    e: console.error,
  },
  posts: {
    data: [
      { path: '/test/1', title: 'test1' },
      { path: '/test/2', title: 'test2' },
      { path: '/test/3', title: 'test3' },
    ]
  },
  config: {
    deploy: [{
      type: 'issues',
      auth,
      repository,
    }]
  }
}
gen(ctx);