var chai = require('chai');  
var expect = chai.expect;
var g = require('./options');

var option = g.config.issues;
var github = g.github;
var posts = g.locals.posts;

// create test repository, if test repository exist, then delete it and recreate it.
function initRepo(done) {
  github.authenticate(option.auth);
  github.repos.get({...option.repository}, (err, rst) => {
    if (err) {
      if (err.status === 'Not Found') {
        github.repos.create({name: option.repository.repo}, (err) => {
          done(err);
        });
      } else {
        done(err);
      }
    } else {
      github.repos.delete({...option.repository}, (err, rst) => {
        if (err) {
          done(err);
        }
        github.repos.create({name: option.repository.repo}, (err, rst) => {
          done(err);
        });
      });
    }
  });
}

let runFlag = 0;
function _runWaitBefore(runId, cb) {
  if (runFlag < runId) {
    setTimeout(() => _runWaitBefore(runId, cb), 1000);
  } else {
    cb();
  }
}

// test first publish
describe('Test create.', function() {
  before(function(done) {
    initRepo(done);
  });

  it('The posts will be publish as 5 issues with title is "title1、title2、title3、title4、title5"', (done) => {
    g.locals._addPost(1);
    g.locals._addPost(2);
    g.locals._addPost(3);
    g.locals._addPost(4);
    g.locals._addPost(5);
    g.generator(g.locals, () => {
      github.issues.getForRepo({
        ...option.repository
      }, (err, res) => {
        expect(res.data.length).to.be.equal(5);
        expect(res.data[4].title).to.be.equal('title1');
        expect(res.data[3].title).to.be.equal('title2');
        expect(res.data[2].title).to.be.equal('title3');
        expect(res.data[1].title).to.be.equal('title4');
        expect(res.data[0].title).to.be.equal('title5');
        expect(res.data[0].body).to.be.equal('content5');
        expect(res.data[0].labels[0].name).to.be.equal('label5');
        runFlag ++;
        done(err);
      });
    });
  })
});

describe('Test update:', function() {
  // update a post.
  it('The post will update the post that _content is "content5" from "content5" to "content55"', (done) => {
    _runWaitBefore(1, () => {
      g.locals.posts[4]._content = "content55"
      g.generator(g.locals, () => {
        github.issues.getForRepo({
          ...option.repository
        }, (err, res) => {
          expect(res.data[0].body).to.be.equal('content55');
          runFlag ++;
          done(err);
        });
      });
    })
  });

  // delete a post.
  it('Delete a post will close the issue', (done) => {
    _runWaitBefore(2, () => {
      g.locals.posts = g.locals.posts.slice(1);
      g.generator(g.locals, () => {
        github.issues.get({
          number: 1,
          ...option.repository
        }, (err, res) => {
          expect(res.data.state).to.be.equal('closed');
          runFlag ++;
          done(err);
        });
      });
    })
  });

  // set issueNumber and not 0
  it('Set a post\'s issueNumber not to 0.', (done) => {
    _runWaitBefore(3, () => {
      g.locals.posts[3].issueNumber = 1;
      g.generator(g.locals, () => {
        github.issues.get({
          number: 1,
          ...option.repository
        }, (err, res) => {
          expect(res.data.state).to.be.equal('open');
          expect(res.data.title).to.be.equal('title5');
          runFlag ++;
          done(err);
        });
      });
    });
  });

  // set issueNumber to 0.
  it('Set a post\'s issueNumber to 0 and the issue also closed.', (done) => {
    _runWaitBefore(4, () => {
      g.locals.posts[3].issueNumber = 0;
      g.generator(g.locals, () => {
        github.issues.getForRepo({
          state: "all",
          ...option.repository
        }, (err, res) => {
          expect(res.data[0].state).to.be.equal('closed');
          expect(res.data[4].state).to.be.equal('closed');
          expect(res.data[1].state).to.be.equal('open');
          expect(res.data[2].state).to.be.equal('open');
          expect(res.data[3].state).to.be.equal('open');
          runFlag ++;
          done(err);
        });
      });
    })
  });  

  // set origin url and .
  it('Set origin url the position is \'top\' and template is default.', (done) => {
    _runWaitBefore(5, () => {
      g.config.issues.sourceLink = {
        position: "top",
        template: ""
      }
      g.locals.posts.forEach((item, index) => item.permalink = 'url' + (index + 2));
      g.generator(g.locals, () => {
        github.issues.getForRepo({
          state: "all",
          ...option.repository
        }, (err, res) => {
          expect(res.data[1].body).to.be.equal('**The original: [title4](url4).**\n\ncontent4');
          expect(res.data[2].body).to.be.equal('**The original: [title3](url3).**\n\ncontent3');
          expect(res.data[3].body).to.be.equal('**The original: [title2](url2).**\n\ncontent2');
          runFlag ++;
          done(err);
        });
      });
    })
  });

  // set origin url.
  it('Set origin url the position is \'bottom\' and template is "url:$$url".', (done) => {
    _runWaitBefore(6, () => {
      g.config.issues.sourceLink = {
        position: "bottom",
        template: "url:$$url"
      }
      g.generator(g.locals, () => {
        github.issues.getForRepo({
          state: "all",
          ...option.repository
        }, (err, res) => {
          expect(res.data[1].body).to.be.equal('content4\n\nurl:[title4](url4)');
          expect(res.data[2].body).to.be.equal('content3\n\nurl:[title3](url3)');
          expect(res.data[3].body).to.be.equal('content2\n\nurl:[title2](url2)');
          runFlag ++;
          done(err);
        });
      });
    })
  });
  
  // clear test repository.
  after(function(done) {
    github.repos.delete({...option.repository}, (err) => {
      done(err);
    });
  });
});
