/* global hexo */
'use strict';

// hexo.extend.deployer.register('github-issue', require('./lib/deployer'));

var github = require('octonode');
var pagesn = 1;
var createQueue = [];
var updateQueue = [];
var client;
var repo;
var posts;
var hexo
var config;
var log;
var repository;

var CREATE_ISSUE_INTERVAL = 2000;

module.exports = function(locals) {
  hexo = this;
  log = hexo.log;
  config = hexo.config;
  var issuesOption = config.issues;
  if (!issuesOption || !issuesOption.repository || !issuesOption.auth) {
    return ;
  }
  repository = issuesOption.repository;
  var auth = issuesOption.auth;
  if (auth.token) {
    client = github.client(auth.token);
  } else if (auth.id && auth.secret) {
    client = github.client({
      id: auth.id,
      secret: auth.secret
    });
  } else if (auth.username && auth.password) {
    client = github.client({
      username: auth.username,
      password: auth.password
    });
  } else {
    console.log('The hexo-generate-issues plugins need authentication.')
    var help = [
      'The hexo-generate-issues plugins need authentication',
      'The authentication config is empty, so it will not upload',
      'For more help, you can check the docs: '
    ];
    log.i(help.join('\n'));
    return;
  }
  repo = client.repo(repository);

  log.i('Your posts will push to %s/issues...', repository);

  var posts = [].concat(locals.posts.toArray(), locals.pages.toArray())
    .sort(function(a, b) {
      return a.date - b.date;
    });

  next(posts);

  return {
    path: null,
    data: ''
  }
}

function next(posts) {
  repo.issues(pagesn, function(err, issues, header) {
    if (!err) {
      if (issues && issues.length) {
        posts.forEach(function(post, index) {
          var issue = issues.find(function(item) {
            return item.title == post.title;
          });
          var _issue = {
            title: post.title,
            body: post._content,
            labels: post.tags.map(function(item) {return item.name}),
            state: "open",
          };
          if (issue) {
            addTask(_issue, issue.number);
            issue._isExist = true;
            post._isExist = true;
          }
        });
        issues.filter(function(issue) {
          return !issue._isExist;
        }).forEach(function(issue, index) {
          var _issue = {
            state: "closed",
          };
          addTask(_issue, issue.number);
        });
        pagesn ++;
        next(posts);
      } else {
        posts.filter(function(post) {
          return !post._isExist;
        }).forEach(function(post, index) {
          var _issue = {
            title: post.title,
            body: post.content,
            labels: post.tags.map(function(item) {return item.name}),
            state: "open",
          };
          addTask(_issue);
        });
        runTask();
      }
      // cb();
    } else {
      log.e('Can not get issues: %s', err);
      return ;
    }
  });
}

function addTask(issue, issueNumber) {
  if (issueNumber) {
    var _task = function(cb) {
      client.issue('tcatche/test', issueNumber).update(issue, function (err, result) {
        if (err) {
          log.e(err);
        } else {
          log.i('Success update issue [/tcatche/test/issues/%s] [%s]', issueNumber, result.title);
        }
        cb && cb();
      });
    }
    updateQueue.push(_task);
  } else {
    var _task = function(cb) { 
      repo.issue(issue, function (err, result) {
        if (err) {
          log.e(err);
        } else {
          log.i('Success create issue [/tcatche/test/issues/%s] [%s]', result.number, issue.title);
        }
        cb && cb();
      });
    }
    createQueue.push(_task);
  }
}

function runTask() {
  var currTaskIndex = 0;
  updateQueue.forEach(function(func) {
    func();
  });
  var cb = function() {
    currTaskIndex++
    if (currTaskIndex < createQueue.length) {
      setTimeout(function() {
        createQueue[currTaskIndex](cb);
      }, CREATE_ISSUE_INTERVAL)
    }
  }
  createQueue.length > 0 && createQueue[currTaskIndex](cb)
}
