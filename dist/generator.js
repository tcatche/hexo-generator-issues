"use strict";

var github = require('octonode');

var createQueue = [];
var updateQueue = [];

var client = void 0;
var repo = void 0;

var log = void 0;
var option = {};

var CREATE_ISSUE_INTERVAL = 2000;
var ISSUE_DELETE_STATE = "closed";
var ISSUE_EXIST_STATE = "open";
var ISSUE_META_KEY = 'issueNumber';
var PER_PAGE_ISSUE = 100;
var TEMPLATE_DEFAULT = '**The original: $$url.**';

module.exports = function (locals) {
  var hexo = this;
  var config = hexo.config;
  log = hexo.log;
  var issuesOption = config.issues;
  if (!issuesOption || !issuesOption.repository || !issuesOption.auth) {
    return;
  }
  option.repository = issuesOption.repository;
  if (issuesOption.sourceLink && issuesOption.sourceLink.position) {
    if (issuesOption.sourceLink.position == 'top' || issuesOption.sourceLink.position == 'bottom') {
      option.position = issuesOption.sourceLink.position, option.template = issuesOption.sourceLink.template || TEMPLATE_DEFAULT;
    }
  }
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
    var help = ['The hexo-generate-issues plugins need authentication', 'The authentication config is empty, so it will not upload', 'For more help, you can check the docs: '];
    log.i(help.join('\n'));
    return;
  }
  repo = client.repo(option.repository);

  run(locals);

  return {
    path: null,
    data: ''
  };
};

function run(locals) {
  var posts = getPosts(locals);
  getIssues(function (issues) {
    setTask(posts, issues);
    log.i('Your posts will push to %s issues...', option.repository);
    runTask();
  });
}

function getPosts(locals) {
  var posts = [].concat(locals.posts.toArray(), locals.pages.toArray()).sort(function (a, b) {
    return a.date - b.date;
  });

  return posts;
}

function getIssues(cb) {
  var issues = [];
  var page = 1;
  var _getIssues = function _getIssues() {
    repo.issues({
      page: page,
      per_page: PER_PAGE_ISSUE,
      state: 'all'
    }, function (err, _issues) {
      if (!err) {
        if (_issues && _issues.length) {
          issues = issues.concat(_issues.map(function (item) {
            return {
              title: item.title,
              number: item.number
            };
          }));
          page++;
          _getIssues();
        } else {
          cb && cb(issues);
        }
      } else {
        log.e('Can not get issues %s', err);
      }
    });
  };
  return _getIssues();
}

function setTask(posts, issues) {
  var _loop = function _loop(post) {
    var issueNumber = post[ISSUE_META_KEY];
    if (issueNumber == 0 || !post.title) {
      return "continue";
    }

    // Add link to point the source post.
    var body = post._content;
    if (option.position && option.position == 'top') {
      var url = option.template.replace(/\$\$url/g, "[" + post.title + "](" + post.permalink + ")");
      body = url + "\n\n" + body;
    } else if (option.position && option.position == 'bottom') {
      var _url = option.template.replace(/\$\$url/g, "[" + post.title + "](" + post.permalink + ")");
      body = body + "\n\n" + _url;
    }
    var _issue = {
      title: post.title,
      body: body,
      labels: post.tags.map(function (item) {
        return item.name;
      }),
      state: ISSUE_EXIST_STATE
    };

    // update issue use ISSUE_META_KEY == issue.number
    if (!isNaN(issueNumber) && issueNumber > 0 && issueNumber <= issues.length) {
      issues[issueNumber - 1]._isExist = true;
      addTask(_issue, issueNumber);
    } else {
      var issue = issues.find(function (item) {
        return !item._isExist && item.title == post.title;
      });

      // update issue with issue.title == post.title.
      if (issue) {
        issue._isExist = true;
        addTask(_issue, issue.number);

        // create issue with post.
      } else {
        addTask(_issue);
      }
    }
  };

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = posts[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var post = _step.value;

      var _ret = _loop(post);

      if (_ret === "continue") continue;
    }

    // close the issues without having relation to a post.
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  issues.filter(function (item) {
    return !item._isExist;
  }).forEach(function (item) {
    return addTask({ state: ISSUE_DELETE_STATE }, item.number);
  });
}

function runTask() {
  var currTaskIndex = 0;
  // Update issues can directly publish.
  updateQueue.forEach(function (func) {
    return func();
  });

  var cb = function cb() {
    currTaskIndex++;
    currTaskIndex < createQueue.length && setTimeout(function () {
      return createQueue[currTaskIndex](cb);
    }, CREATE_ISSUE_INTERVAL);
  };
  // Create issues rate be limited, so create one fo the issues per 2s.
  createQueue.length > 0 && createQueue[currTaskIndex](cb);
}

function addTask(issue, issueNumber) {
  if (issueNumber) {
    var _task = function _task(cb) {
      client.issue(option.repository, issueNumber).update(issue, function (err, result) {
        if (err) {
          log.e('Update issue [url: /%s/issues/%s] [title: %s] failed: %s', option.repository, issueNumber, issue.title, err);
        } else {
          log.i('Success update issue [url: /%s/issues/%s] [title: %s]', option.repository, issueNumber, result.title);
        }
        cb && cb();
      });
    };
    updateQueue.push(_task);
  } else {
    var _task2 = function _task2(cb) {
      repo.issue(issue, function (err, result) {
        if (err) {
          console.log(issue);
          log.e('Create issue [title: %s] failed: %s', issue.title, err);
        } else {
          log.i('Success create issue [url: /%s/issues/%s] [title: %s]', option.repository, result.number, issue.title);
        }
        cb && cb();
      });
    };
    createQueue.push(_task2);
  }
}