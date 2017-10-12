var should = require('chai').should();

// todo
describe('hexo-generator-alias', function() {
  var Hexo = require('hexo');
  var hexo = new Hexo(__dirname, {silent: true});
  var generator = require('../src/generator');
  var inner = generator._inner;
  generator = generator.bind(hexo);
  before(function() {
    hexo.config.issues = {
      auth: {
        type: 'token',
        token: '*******************************' 
      },
      repository: {
        owner: 'tcatche',
        repo: 'test'
      },
      sourceLink: {
        position: 'top',
        template: '**本文博客地址：$$url.**'
      },
    }
    return hexo.init();
  });

  beforeEach(function() {
    hexo.locals.invalidate();
  });

  // todo
  it('test', function(done) {
    this.timeout(10000);
    var Post = hexo.model('Post');
    Post.insert([
      // alias - string
      {
        source: 'foo',
        title: 'foo',
        slug: 'foo',
      },
      {
        source: 'bar',
        title: 'bar',
        slug: 'bar',
      },
      {
        source: 'baz',
        title: 'baz',
        slug: 'baz',
      },
      {
        source: 'boo',
        title: 'boo',
        slug: 'boo',
      },
      {
        source: 'bee',
        title: 'bee',
        slug: 'bee',
      }
    ]).then(function() {
      // todo test
      done();
    }).finally(function() {
      return Post.remove({});
    });
  });
});