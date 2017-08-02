"use strict";

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var GitHubApi = require("github");
var github = void 0;

var createQueue = void 0;
var updateQueue = void 0;

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

module.exports = function (locals, finalCB) {
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
  github = new GitHubApi({
    debug: false,
    protocol: "https",
    host: "api.github.com", // should be api.github.com for GitHub
    headers: {
      "user-agent": "hexo-igenerator-issue" // GitHub is happy with a unique user agent
    },
    timeout: 5000
  });
  var auth = issuesOption.auth;
  if (auth) {
    github.authenticate(auth);
  } else {
    var help = ['The hexo-generate-issues plugins need authentication', 'The authentication config is empty, so it will not upload', 'For more help, you can check the docs: '];
    log.i(help.join('\n'));
    return;
  }

  createQueue = [];
  updateQueue = [];

  run(locals, finalCB);
};

function run(locals, finalCB) {
  var posts = getPosts(locals);
  getIssues(function (issues) {
    setTask(posts, issues);
    log.i('Your posts will push to %s/%s issues...', option.repository.owner, option.repository.repo);
    runTask(finalCB);
  });
}

function getPosts(locals) {
  var posts = [].concat(locals.posts, locals.pages).sort(function (a, b) {
    return a.date - b.date;
  });

  return posts;
}

function getIssues(cb) {
  var issues = [];
  var page = 1;
  var _getIssues = function _getIssues() {
    github.issues.getForRepo(_extends({
      page: page,
      per_page: PER_PAGE_ISSUE,
      state: 'all'
    }, option.repository), function (err, _issues) {
      if (!err) {
        if (_issues && _issues.data && _issues.data.length) {
          issues = issues.concat(_issues.data.map(function (item) {
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
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    var _loop = function _loop() {
      var post = _step.value;

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
        var issue = issues.find(function (item) {
          return !item._isExist && item.number == issueNumber;
        });

        // update issue with issue.number == issueNumber.
        if (issue) {
          issue._isExist = true;
          addTask(_issue, issue.number);

          // The issueNumber has been used.update issue with issue.title == post.title.
        } else {
          issue = issues.find(function (item) {
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
      } else {
        var _issue2 = issues.find(function (item) {
          return !item._isExist && item.title == post.title;
        });

        // update issue with issue.title == post.title.
        if (_issue2) {
          _issue2._isExist = true;
          addTask(_issue, _issue2.number);

          // create issue with post.
        } else {
          addTask(_issue);
        }
      }
    };

    for (var _iterator = posts[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var _ret = _loop();

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

function runTask(finalCB) {
  var currTaskIndex = 0;

  // Update issues can directly publish.
  updateQueue.forEach(function (func, index) {
    if (createQueue.length == 0 && index === updateQueue.length - 1) {
      func(finalCB);
    } else {
      func();
    }
  });

  // Create issues rate be limited, so create one fo the issues per 2s.
  var cb = function cb() {
    currTaskIndex++;
    currTaskIndex < createQueue.length && setTimeout(function () {
      return createQueue[currTaskIndex](cb);
    }, CREATE_ISSUE_INTERVAL);
    currTaskIndex >= createQueue.length && finalCB && finalCB();
  };
  createQueue.length > 0 && createQueue[currTaskIndex](cb);
}

function addTask(issue, number) {
  if (number) {
    var _task = function _task(cb) {
      github.issues.edit(_extends({
        number: number
      }, issue, option.repository), function (err, res) {
        if (err) {
          log.e('Update issue [url: /%s/%s/issues/%s] [title: %s] failed: %s', option.repository.owner, option.repository.repo, number, issue.title, err);
        } else {
          log.i('Success update issue [url: /%s/%s/issues/%s] [title: %s]', option.repository.owner, option.repository.repo, number, issue.title || res.data.title);
        }
        cb && cb();
      });
    };
    updateQueue.push(_task);
  } else {
    var _task2 = function _task2(cb) {
      github.issues.create(_extends({}, option.repository, issue), function (err, res) {
        if (err) {
          log.e('Create issue [title: %s] failed: %s', issue.title, err);
        } else {
          log.i('Success create issue [url: /%s/%s/issues/%s] [title: %s]', option.repository.owner, option.repository.repo, res.data.number, issue.title);
        }
        cb && cb();
      });
    };
    createQueue.push(_task2);
  }
}