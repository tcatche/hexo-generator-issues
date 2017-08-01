let github = require('octonode');

let createQueue = [];
let updateQueue = [];

let client;
let repo;

let log;
let option = {};

const CREATE_ISSUE_INTERVAL = 2000;
const ISSUE_DELETE_STATE = "closed";
const ISSUE_EXIST_STATE = "open";
const ISSUE_META_KEY = 'issueNumber';
const PER_PAGE_ISSUE = 100;
const TEMPLATE_DEFAULT = '**The original: $$url.**';

module.exports = function (locals) {
  let hexo = this;
  let config = hexo.config;
  log = hexo.log;
  let issuesOption = config.issues;
  if (!issuesOption || !issuesOption.repository || !issuesOption.auth) {
    return;
  }
  option.repository = issuesOption.repository;
  if (issuesOption.sourceLink && issuesOption.sourceLink.position) {
    if (issuesOption.sourceLink.position == 'top' || issuesOption.sourceLink.position == 'bottom') {
      option.position = issuesOption.sourceLink.position,
      option.template = issuesOption.sourceLink.template || TEMPLATE_DEFAULT
    }
  }
  let auth = issuesOption.auth;
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
    let help = [
      'The hexo-generate-issues plugins need authentication',
      'The authentication config is empty, so it will not upload',
      'For more help, you can check the docs: '
    ];
    log.i(help.join('\n'));
    return;
  }
  repo = client.repo(option.repository);

  run(locals);

  return {
    path: null,
    data: ''
  }
}

function run(locals) {
  let posts = getPosts(locals);
  getIssues(issues => {
    setTask(posts, issues);
    log.i('Your posts will push to %s issues...', option.repository);
    runTask();
  })
}

function getPosts(locals) {
  let posts = [].concat(locals.posts.toArray(), locals.pages.toArray())
    .sort((a, b) => a.date - b.date);

  return posts;
}

function getIssues(cb) {
  let issues = [];
  let page = 1;
  let _getIssues = function () {
    repo.issues({
      page,
      per_page: PER_PAGE_ISSUE,
      state: 'all'
    }, function (err, _issues) {
      if (!err) {
        if (_issues && _issues.length) {
          issues = issues.concat(_issues.map(item => ({
            title: item.title,
            number: item.number
          })));
          page ++;
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
  for (let post of posts) {
    let issueNumber = post[ISSUE_META_KEY];
    if (issueNumber == 0 || !post.title) {
      continue;
    }

    // Add link to point the source post.
    let body = post._content;
    if (option.position && option.position == 'top') {
      let url = option.template.replace(/\$\$url/g, `[${post.title}](${post.permalink})`);
      body = `${url}\n\n${body}`;
    } else if (option.position && option.position == 'bottom') {
      let url = option.template.replace(/\$\$url/g, `[${post.title}](${post.permalink})`);
      body = `${body}\n\n${url}`;
    }
    let _issue = {
      title: post.title,
      body,
      labels: post.tags.map(item =>item.name),
      state: ISSUE_EXIST_STATE,
    };

    // update issue use ISSUE_META_KEY == issue.number
    if (!isNaN(issueNumber) && issueNumber > 0 && issueNumber <= issues.length) {
      issues[issueNumber - 1]._isExist = true;
      addTask(_issue, issueNumber);
    } else {
      let issue = issues.find(item => !item._isExist && item.title == post.title);

      // update issue with issue.title == post.title.
      if (issue) {
        issue._isExist = true;
        addTask(_issue, issue.number);

      // create issue with post.
      } else {
        addTask(_issue);
      }
    }
  }

  // close the issues without having relation to a post.
  issues.filter(item => !item._isExist).forEach(item => addTask({ state: ISSUE_DELETE_STATE, }, item.number));
}

function runTask() {
  let currTaskIndex = 0;
  // Update issues can directly publish.
  updateQueue.forEach(func => func());
  
  let cb = function () {
    currTaskIndex ++;
    currTaskIndex < createQueue.length && setTimeout(() => createQueue[currTaskIndex](cb), CREATE_ISSUE_INTERVAL);
  }
  // Create issues rate be limited, so create one fo the issues per 2s.
  createQueue.length > 0 && createQueue[currTaskIndex](cb)
}

function addTask(issue, issueNumber) {
  if (issueNumber) {
    let _task = function (cb) {
      client.issue(option.repository, issueNumber).update(issue, (err, result) => {
        if (err) {
          log.e('Update issue [url: /%s/issues/%s] [title: %s] failed: %s', option.repository, issueNumber, issue.title, err);
        } else {
          log.i('Success update issue [url: /%s/issues/%s] [title: %s]', option.repository, issueNumber, result.title);
        }
        cb && cb();
      });
    }
    updateQueue.push(_task);
  } else {
    let _task = function (cb) {
      repo.issue(issue, (err, result) => {
        if (err) {
          console.log(issue)
          log.e('Create issue [title: %s] failed: %s', issue.title, err);
        } else {
          log.i('Success create issue [url: /%s/issues/%s] [title: %s]', option.repository, result.number, issue.title);
        }
        cb && cb();
      });
    }
    createQueue.push(_task);
  }
}
