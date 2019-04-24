'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

/**
 * Load all of the issues from the github repo.
 */
let fetchAllIssues = (() => {
  var _ref = _asyncToGenerator(function* () {
    log.i('Generator-Issues-Plugin: Fetching the issues in repository %s...', options.repos);
    try {
      let issues = yield githubApi.fetchAllIssues();
      issues = issues.map(function (item) {
        return {
          title: item.title,
          number: item.number,
          state: item.state
        };
      }).sort(function (a, b) {
        return a.number - b.number;
      });
      return issues;
    } catch (err) {
      log.e('Generator-Issues-Plugin: Fetch issues Failed!');
      throw err;
    }
  });

  return function fetchAllIssues() {
    return _ref.apply(this, arguments);
  };
})();

/**
 * The task runner to push all issues to github.
 * 1. first, update all issues need to be, when error occurs,it will ignore it.
 * 2. Then, create all issues need to be, when error occurs,it will stop.
 * @param {*} issueQueue 
 */
let pushAllIssues = (() => {
  var _ref2 = _asyncToGenerator(function* (issueQueue) {
    let taskLogs = {
      success: {}
    };
    function saveLog(issue, number) {
      taskLogs.success[issue.__id] = {
        id: issue.__id,
        number: issue.number || number,
        path: issue.path,
        title: issue.title
      };
    };

    const updateIssueQueue = issueQueue.filter(function (issue) {
      return issue.number;
    });
    const createIssueQueue = issueQueue.filter(function (issue) {
      return !issue.number;
    });
    log.i(`Generator-Issues-Plugin: Begin push your posts to ${options.repos}...`);
    log.i(`Generator-Issues-Plugin: The number to be updated is: ${updateIssueQueue.length}`);
    log.i(`Generator-Issues-Plugin: The number to be created is: ${createIssueQueue.length}`);

    // Update issues concurrently.
    // when error occurs, stop create issues.
    if (updateIssueQueue.length > 0) {
      updateIssueQueue.forEach((() => {
        var _ref3 = _asyncToGenerator(function* (issue) {
          try {
            const res = yield githubApi.push(issue);
            saveLog(issue);
            if (issue.state === ISSUE_DELETE_STATE) {
              log.i(`Generator-Issues-Plugin: Success closed: [url: /${options.repos}/issues/${issue.number}] [title: ${issue.title || res.data.title}]`);
            } else {
              log.i(`Generator-Issues-Plugin: Success updated: [url: /${options.repos}/issues/${issue.number}] [title: ${issue.title || res.data.title}]`);
            }
          } catch (err) {
            if (issue.state === ISSUE_DELETE_STATE) {
              log.e(`Generator-Issues-Plugin: Fail closed: [url: /${options.repos}/issues/${issue.number}] [title: ${issue.title || res.data.title}]`);
            } else {
              log.e(`Generator-Issues-Plugin: Fail updated: [url: /${options.repos}/issues/${issue.number}] [title: ${issue.title || res.data.title}]`);
            }
          }
        });

        return function (_x2) {
          return _ref3.apply(this, arguments);
        };
      })());
    }

    // Create issues serially.
    // when error occurs, stop create issues.
    if (createIssueQueue.length > 0) {
      for (const issue of createIssueQueue) {
        try {
          const res = yield githubApi.push(issue);
          log.i(`Generator-Issues-Plugin: Success to create issue [url: /${options.repos}/issues/${res.data.number}] [title: ${issue.title || response.data.title}]`);
          saveLog(issue, res.data.number);
          yield new Promise(function (resolve) {
            setTimeout(resolve, CREATE_ISSUE_INTERVAL);
          });
        } catch (err) {
          log.e(`Generator-Issues-Plugin: Fail to create issue [title: ${issue.title}]:`);
          log.e(err);
          log.e('Generator-Issues-Plugin: Stop push issues!');
          return taskLogs;
        }
      }
    }

    log.i('Generator-Issues-Plugin: Push finish!');
    return taskLogs;
  });

  return function pushAllIssues(_x) {
    return _ref2.apply(this, arguments);
  };
})();

// save push history to local file.
// The history will reduce next push cost.
let savePushLogs = (() => {
  var _ref4 = _asyncToGenerator(function* (logs, lastRecords) {
    log.i('Generator-Issues-Plugin: Saving push history...');
    let records = {
      success: Object.assign({}, lastRecords.success, logs.success),
      updated: (0, _moment2.default)().format()
    };

    yield _hexoFs2.default.writeFile(PATH, JSON.stringify(records));
    log.i('Generator-Issues-Plugin: Success saved push history.');
  });

  return function savePushLogs(_x3, _x4) {
    return _ref4.apply(this, arguments);
  };
})();

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _hexoFs = require('hexo-fs');

var _hexoFs2 = _interopRequireDefault(_hexoFs);

var _rest = require('@octokit/rest');

var _rest2 = _interopRequireDefault(_rest);

var _md = require('md5');

var _md2 = _interopRequireDefault(_md);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const CREATE_ISSUE_INTERVAL = 2000;
const ISSUE_DELETE_STATE = "closed";
const ISSUE_EXIST_STATE = "open";
const ISSUE_META_KEY = 'issueNumber';
const PER_PAGE_ISSUE = 100;
const TEMPLATE_DEFAULT = '**The original = $$url.**';
const PATH = './_issue_generator_record';
const CONNECT_GITHUB_TIMEOUT = 10000;

let githubApi;
let log = {};
let options = {};

/**
 * init params.
 * @param {any} ctx hexo
 * @returns 
 */
function init(ctx) {
  log = ctx.log;
  const issuesOption = ctx.config.issues;
  if (!issuesOption || !issuesOption.repository || !issuesOption.auth) {
    let help = `
      Generator-Issues-Plugin: The hexo-generate-issues plugins need auth and repository options.
      Some of the options is not exist, so the plugin will not run.
      For more help, you can check the docs: https://www.npmjs.com/package/hexo-generator-issues.
    `;
    log.w(help);
    return false;
  }

  options.repository = issuesOption.repository;
  options.auth = issuesOption.auth;
  options.repos = `${options.repository.owner}/${options.repository.repo}`;

  if (issuesOption.sourceLink && issuesOption.sourceLink.position) {
    if (issuesOption.sourceLink.position == 'top' || issuesOption.sourceLink.position == 'bottom') {
      options.position = issuesOption.sourceLink.position;
      options.template = issuesOption.sourceLink.template || TEMPLATE_DEFAULT;
    }
  }

  // init github api
  githubApi = getGithubApi(options);

  return true;
}

/**
 * github api tools
 * @param {} options 
 */
function getGithubApi(options) {
  const octokit = new _rest2.default({
    debug: false,
    protocol: "https",
    host: "api.github.com", // should be api.github.com for GitHub
    headers: {
      "user-agent": "hexo-igenerator-issue" // GitHub is happy with a unique user agent
    },
    timeout: CONNECT_GITHUB_TIMEOUT,
    Promise
  });

  octokit.authenticate(options.auth);

  return {
    /**
     * get the page issues from github.
     * @param {number} page
     * @param {number} per_page
     * @returns {Promise}
     */
    fetchIssues(page = 1, per_page = PER_PAGE_ISSUE) {
      return octokit.issues.getForRepo(_extends({
        page,
        per_page,
        state: 'all'
      }, options.repository));
    },
    /**
     * get all issues from github.
     * @param {number} page
     * @param {number} per_page
     * @returns {array} data
     */
    fetchAllIssues() {
      var _this = this;

      return _asyncToGenerator(function* () {
        let response = yield _this.fetchIssues();
        let { data } = response;
        while (octokit.hasNextPage(response)) {
          response = yield octokit.getNextPage(response);
          data = data.concat(response.data);
        }
        return data;
      })();
    },
    /**
     * push a issue to github.
     * It use issue.number to decide whether to create or update a github issue.
     * @param {*} issue object, create from createIssueObject function.
     * @returns {Promise}
     */
    push(issue) {
      let issueParams = _extends({}, issue, options.repository);
      if (issue.number) {
        return octokit.issues.edit(issueParams);
      } else {
        return octokit.issues.create(issueParams);
      }
    }
  };
};

/**
 * if there isn't records, then use github issues to create the records.
 * 
 * @param {*} savedRecords 
 * @param {*} posts 
 * @param {*} issues 
 */
function initSavedRecords(savedRecords, posts, issues) {
  let records = {};
  Object.assign(records, savedRecords);
  if (!records.success) {
    records.success = {};
    // issues.length > 0 则使用 issues 构建
    if (issues.length > 0) {
      let findCounts = 0;
      for (let issue of issues) {
        if (findCounts === posts.length) {
          break;
        }

        let post = posts.find(aPost => issue.title == aPost.title);

        if (post) {
          records.success[post.__uid] = {
            id: post.__uid,
            number: issue.number,
            title: post.title,
            path: post.path
          };
          findCounts++;
        }
      }
    }
  }

  if (!records.updated) {
    records.updated = (0, _moment2.default)(0).format();
  }

  return records;
}

/**
 * load last time generate history.
 * if there are last time generate records, then just use it and do not check whether the records is valid or not.
 * if there isn't records, then use github issues to create the records.
 * 
 * @param {*} posts 
 * @param {*} issues 
 */
const loadRecords = (posts, issues) => _hexoFs2.default.exists(PATH).then(exist => {
  if (!exist) return undefined;

  return _hexoFs2.default.readFile(PATH).then(content => {
    return !!content ? JSON.parse(content) : undefined;
  });
}).then(savedRecords => initSavedRecords(savedRecords, posts, issues));

/**
 * If the post need to be updated.
 * @param {*} post 
 * @param {*} lastRecords 
 */
const isPostNeedUpdate = (post, lastRecords) => post.__uid in lastRecords.success && (0, _moment2.default)(lastRecords.updated) < (0, _moment2.default)(post.updated);

/**
 * If the post have created issus.
 * @param {*} post 
 * @param {*} lastRecords 
 */
const isPostNeedCreate = (post, lastRecords) => !(post.__uid in lastRecords.success);

/**
 * load posts, filter out the post that doesn't need update and sort the rest posts.
 * @param {*} locals 
 */
function loadPosts(locals) {
  locals.posts.data.forEach(post => post.__uid = (0, _md2.default)(post.path));
  return locals.posts.data.sort((a, b) => a.date - b.date);
}

/**
 * Create the create and update issues list with this three steps:
 * 1. filter out posts that don't need being updated
 * 2. add create and update issue.
 * 3. find the alone issue without having relation to a post and state is equal to ISSUE_EXIST_STATE and close these issues.
 * 
 * @param {*} posts 
 * @param {*} issues 
 * @param {*} lastRecords 
 */
function createPushIssues(posts, issues, lastRecords) {
  let pushIssues = [];

  // filter out posts that don't need being updated
  posts = posts.filter(post => {
    return !!post.title && (isPostNeedUpdate(post, lastRecords) || isPostNeedCreate(post, lastRecords));
  });

  // add create and update post object
  for (let post of posts) {
    let _issue = createIssueObject(post);
    if (isPostNeedUpdate(post, lastRecords)) {
      let number = lastRecords.success[post.__uid].number;
      let gitIssues = issues.find(issue => issue.number == number);
      if (gitIssues) {
        gitIssues._isExist = true;
        _issue.number = number;
      }
    }
    pushIssues.push(_issue);
  }

  // find the alone issue without having relation to a post and state is equal to ISSUE_EXIST_STATE.
  // and close these issues.
  for (let recordId in lastRecords.success) {
    let record = lastRecords.success[recordId];
    let gitIssue = issues[record.number - 1];
    if (gitIssue && gitIssue.number == record.number) {
      gitIssue._isExist = true;
    }
  }

  issues.filter(issue => !issue._isExist && issue.state === ISSUE_EXIST_STATE).forEach(issue => pushIssues.push({ title: issue.title, state: ISSUE_DELETE_STATE, number: issue.number }));

  return pushIssues;
}

/**
 * Create issue data object for the post need to be create or update.
 * @param {*} post 
 */
function createIssueObject(post) {
  // Add link to point the source post.
  let body = post._content;
  if (options.position && options.position == 'top') {
    let url = options.template.replace(/\$\$url/g, `[${post.title}](${post.permalink})`);
    body = `${url}\n\n${body}`;
  } else if (options.position && options.position == 'bottom') {
    let url = options.template.replace(/\$\$url/g, `[${post.title}](${post.permalink})`);
    body = `${body}\n\n${url}`;
  }

  return {
    title: post.title,
    body,
    labels: post.tags.map(item => item.name),
    state: ISSUE_EXIST_STATE,
    __id: post.__uid,
    path: post.path
  };
};;

const generator = (() => {
  var _ref5 = _asyncToGenerator(function* (locals) {
    if (!init(this)) {
      return {};
    };

    try {
      const posts = loadPosts(locals);
      const issues = yield fetchAllIssues();
      const lastRecords = yield loadRecords(posts, issues);
      const pushIssues = createPushIssues(posts, issues, lastRecords);
      const pushLogs = yield pushAllIssues(pushIssues);
      yield savePushLogs(pushLogs, lastRecords);
      return {};
    } catch (err) {
      log.e('Generator-Issues-Plugin: ', err);
      return {};
    }
  });

  return function generator(_x5) {
    return _ref5.apply(this, arguments);
  };
})();

// for test.
if (process.env.NODE_ENV === "development") {
  function _setInner({ log, githubApi, options }) {
    log = log;
    githubApi = githubApi;
    options = options;
  }
  function _getAllConstants() {
    return {
      CREATE_ISSUE_INTERVAL,
      ISSUE_DELETE_STATE,
      ISSUE_EXIST_STATE,
      ISSUE_META_KEY,
      PER_PAGE_ISSUE,
      TEMPLATE_DEFAULT,
      PATH,
      CONNECT_GITHUB_TIMEOUT
    };
  }
  generator._inner = {
    _setInner,
    _getAllConstants,
    init,
    fetchAllIssues,
    loadRecords,
    isPostNeedUpdate,
    isPostNeedCreate,
    loadPosts,
    createPushIssues,
    createIssueObject,
    pushAllIssues,
    savePushLogs
  };
}

module.exports = generator;