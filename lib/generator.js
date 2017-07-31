'use strict';

var github = require('octonode');
var createQueue = [];
var updateQueue = [];

var client;
var repo;

var hexo
var log;
var repository;

var CREATE_ISSUE_INTERVAL = 2000;
var ISSUE_DELETE_STATE = "closed";
var ISSUE_EXIST_STATE = "open";
var ISSUE_META_KEY = 'issueNumber';

module.exports = function(locals) {
  hexo = this;
  log = hexo.log;
  var config = hexo.config;
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
    var help = [
      'The hexo-generate-issues plugins need authentication',
      'The authentication config is empty, so it will not upload',
      'For more help, you can check the docs: '
    ];
    log.i(help.join('\n'));
    return;
  }
  repo = client.repo(repository);

  run(locals);

  return {
    path: null,
    data: ''
  }
}

function run(locals) {
  var posts = getPosts(locals);
  getIssues(function(issues) {
    setTask(posts, issues);
    log.i('Your posts will push to %s issues...', repository);
    runTask();
  })
}

function getPosts(locals) {
  var posts = [].concat(locals.posts.toArray(), locals.pages.toArray())
    .sort(function(a, b) {
      return a.date - b.date;
    });

  return posts;
}

function getIssues(cb) {
  var issues = [];
  var pagesn = 1;
  var _getIssues = function() {
    repo.issues({
      page: pagesn,
      per_page: 100,
      state: 'all'
    }, function(err, _issues) {
      if (!err) {
        if (_issues && _issues.length) {
          issues = issues.concat(_issues.map(item => ({
            title: item.title,
            number: item.number
          })));
          pagesn ++;
          _getIssues();
        } else {
          cb && cb(issues);
        }
      } else {
        log.e('Can not get issues %s', err);
      }
    });
  }
  return _getIssues();
}

function setTask(posts, issues) {
  posts.forEach(post => {
    var _issue = {
      title: post.title,
      body: post._content,
      labels: post.tags.map(function(item) {return item.name}),
      state: ISSUE_EXIST_STATE,
    };
    var issueNumber = post[ISSUE_META_KEY];
    // update issue use ISSUE_META_KEY == issue.number
    if (!isNaN(issueNumber) && issueNumber > 0 && issueNumber <= issues.length) {
      issues[issueNumber - 1]._isExist = true;
      addTask(_issue, issueNumber);
    } else {
      var issue = issues.find(item => !item._isExist && item.title == post.title);
      // update issue with issue.title == post.title.
      if (issue) {
        issue._isExist = true;
        addTask(_issue, issue.number);
      // create issue with post.
      } else {
        addTask(_issue);
      }
    }
  });

  // close the issues without having relation to a post.
  issues.filter(item => !item._isExist).forEach(item => addTask({ state: ISSUE_DELETE_STATE, }, item.number));
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

function addTask(issue, issueNumber) {
  if (issueNumber) {
    var _task = function(cb) {
      client.issue('tcatche/test', issueNumber).update(issue, function (err, result) {
        if (err) {
          log.e('Can not get issues %s', err);
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
          log.e('Can not get issues %s', err);
        } else {
          log.i('Success create issue [/tcatche/test/issues/%s] [%s]', result.number, issue.title);
        }
        cb && cb();
      });
    }
    createQueue.push(_task);
  }
}
