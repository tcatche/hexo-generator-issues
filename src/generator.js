import moment from 'moment';
import fs from 'hexo-fs';
import GitHubApi from "github";
import md5 from 'md5';

const CREATE_ISSUE_INTERVAL = 2000;
const ISSUE_DELETE_STATE = "closed";
const ISSUE_EXIST_STATE = "open";
const ISSUE_META_KEY = 'issueNumber';
const PER_PAGE_ISSUE = 100;
const TEMPLATE_DEFAULT = '**The original = $$url.**';
const PATH = './_issue_generator_record';
const CONNECT_GITHUB_TIMEOUT = 100000;

let hexo;
let config;
let github;
let log;
log = {};
let options = {};
log.i = console.log;
log.e = console.error;


/**
 * init params.
 * @param {any} ctx 
 * @returns 
 */
const init = (ctx) => {
  hexo = ctx;
  config = hexo.config;
  log = hexo.log;
  log = {};
  log.i = console.log;
  log.e = console.error;

  let issuesOption = config.issues;
  if (!issuesOption || !issuesOption.repository || !issuesOption.auth) {
    return false;
  }

  options.repository = issuesOption.repository;
  options.auth = issuesOption.auth;

  if (issuesOption.sourceLink && issuesOption.sourceLink.position) {
    if (issuesOption.sourceLink.position == 'top' || issuesOption.sourceLink.position == 'bottom') {
      options.position = issuesOption.sourceLink.position;
      options.template = issuesOption.sourceLink.template || TEMPLATE_DEFAULT;
    }
  }

  // init github api
  
  github = new GitHubApi({
    debug: false,
    protocol: "https",
    host: "api.github.com", // should be api.github.com for GitHub
    headers: {
      "user-agent": "hexo-igenerator-issue" // GitHub is happy with a unique user agent
    },
    timeout: CONNECT_GITHUB_TIMEOUT,
    Promise,
  });

  if (options.auth) {
    github.authenticate(options.auth);
  } else {
    let help = [
      'The hexo-generate-issues plugins need authentication',
      'The authentication config is empty, so it will not upload',
      'For more help, you can check the docs: '
    ];
    log.i(help.join('\n'));
    return false;
  }
  return true;
}

/**
 * Load all of the issues from the github repo.
 */
const fetchAllIssues = () => {
  let issues = [];
  let page = 1;
  // return Promise.resolve([]);
  log.i('Fetching the issues in repository...')
  let _fetchIssues = () => 
    new Promise((resolve, reject) => {
      github.issues.getForRepo({
        page,
        per_page: PER_PAGE_ISSUE,
        state: 'all',
        ...options.repository,
      }).then(_issues => {
        if (_issues && _issues.data) {
          issues = issues.concat(_issues.data.map(item => ({
            title : item.title,
            number: item.number,
            state : item.state
          })));
          if (_issues.data.length < PER_PAGE_ISSUE) {
            resolve(issues);
          } else {
            page++;
            _fetchIssues();
          }
        } else {
          resolve(issues);
        }
      }).catch(err => {
        log.e('Can not get issues %s', err);
        reject(err);
      });
    });

  return _fetchIssues().then(issues => issues.sort((a, b) => a.number - b.number));
};

/**
 * if there isn't records, then use github issues to create the records.
 * 
 * @param {*} savedRecords 
 * @param {*} posts 
 * @param {*} issues 
 */
const initSavedRecords = (savedRecords, posts, issues) => {
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
            path: post.path,
          }
          findCounts ++;
        }
      }
    }
  }
  
  if (!records.updated) {
    records.updated = moment(0).format()
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
const loadRecords = (posts, issues) =>
  fs.exists(PATH).then(exist => {
    if (!exist) return undefined;

    return fs.readFile(PATH).then(content => {
      return !!content ? JSON.parse(content) : undefined;
    });
  }).then(savedRecords => initSavedRecords(savedRecords, posts, issues));

/**
 * If the post need to be updated.
 * @param {*} locals 
 */
const isPostNeedUpdate = (post, lastRecords) =>
  post.__uid in lastRecords.success && moment(lastRecords.updated) < moment(post.updated);

  
/**
 * If the post have created issus.
 * @param {*} locals 
 */
const isPostNeedCreate = (post, lastRecords) => !(post.__uid in lastRecords.success);

/**
 * load posts, filter out the post that doesn't need update and sort the rest posts.
 * @param {*} locals 
 */
const loadPosts = (locals) => {
  locals.posts.data.forEach(post => post.__uid = md5(post.path));
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
const createPublishIssues = (posts, issues, lastRecords) => {
  let publishIssues = [];
  
  // filter out posts that don't need being updated
  posts = posts.filter(
    post => {
      return !!post.title && (isPostNeedUpdate(post, lastRecords) || isPostNeedCreate(post, lastRecords))
    }
  )

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
    publishIssues.push(_issue);
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
  
  issues
    .filter(issue => !issue._isExist && issue.state === ISSUE_EXIST_STATE)
    .forEach(issue => publishIssues.push({ title: issue.title, state: ISSUE_DELETE_STATE, number: issue.number }));

  return publishIssues;
}

/**
 * Create issue data object for the post need to be create or update.
 * @param {*} post 
 */
const createIssueObject = post => {
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
    path: post.path,
  };
};

/**
 * push a issue to github.
 * It use issue.number to decide create or update github issue.
 * @param {*} issue object, create from createIssueObject function.
 * @returns {Promise}
 */
const pushToGithub = issue => {
  let issueParams = { ...issue, ...options.repository };
  if (issue.number) {
    return github.issues.edit(issueParams);
  } else {
    return github.issues.create(issueParams);
  }
};

/**
 * The task runner to publish all issues to github.
 * 1. first, update all issues need to be, when error occurs,it will ignore it.
 * 2. Then, create all issues need to be, when error occurs,it will stop.
 * @param {*} issueQueue 
 */
const publishAllIssues = (issueQueue) => {
  let taskLogs = {
    success: {},
  };
  function saveLog(issue, number) {
    if (issue) {
      taskLogs.success[issue.__id] = {
        id: issue.__id,
        number: issue.number || number,
        path: issue.path ,
        title: issue.title ,
      }
    }
  };

  const updateIssueQueue = issueQueue.filter(issue => issue.number);
  const createIssueQueue = issueQueue.filter(issue => !issue.number);
  log.i('Begin push your posts to %s/%s ...', options.repository.owner, options.repository.repo);
  log.i('The number to be updated is: %s', updateIssueQueue.length);
  log.i('The number to be created is: %s', createIssueQueue.length);
  let taskPromise = Promise.resolve();

  // Update issues.
  if (updateIssueQueue.length > 0) {
    taskPromise = updateIssueQueue.reduce((promise, issue) =>
      promise.then(() =>
        pushToGithub(issue).then(res => {
          if (issue.state === ISSUE_DELETE_STATE) {
            log.i('Success to close issue [url: /%s/%s/issues/%s] [title: %s]', options.repository.owner, options.repository.repo, issue.number, issue.title || res.data.title);
          } else {
            log.i('Success to update issue [url: /%s/%s/issues/%s] [title: %s]', options.repository.owner, options.repository.repo, issue.number,issue.title || res.data.title);
          }
          saveLog(issue, null);
          return;
        }).catch(err => {
          log.e('Fail to update issue [url: /%s/%s/issues/%s] [title: %s] : %s', options.repository.owner, options.repository.repo, issue.number, issue.title, err);
          return;
        })
      ), taskPromise);
  }

  // Create issues.
  if (createIssueQueue.length > 0) {
    taskPromise = createIssueQueue.reduce((promise, issue) =>
      promise.then(() => new Promise((resolve, reject) =>
        pushToGithub(issue).then(res => {
          log.i('Success to create issue [url: /%s/%s/issues/%s] [title: %s]', options.repository.owner, options.repository.repo, res.data.number, issue.title);
          saveLog(issue, res.data.number);
          setTimeout(resolve, CREATE_ISSUE_INTERVAL);
        }).catch(err => {
          log.e('Fail to create issue [title: %s] : %s', issue.title, err);
          reject(err);
        }))
    ), taskPromise);
  }

  return taskPromise.then(() => {
    log.i('Publish finish!');
    return ;
  }).catch(() => {
    log.e('Create error occurs and stop publish!!!');
    return ;
  }).then(() => taskLogs);
};

// save publish history to local file.
// The history will reduce next publish cost.
const savePublishLogs = (logs, lastRecords) => {
  log.i('Saving publish history...');
  let records = {
    success: Object.assign({}, lastRecords.success, logs.success),
    updated: moment().format()
  }

  return fs.writeFile(PATH, JSON.stringify(records))
    .then(() => log.i('Success saved publish history.'))
    .catch(err => log.e(err));
}

const generator = async function (locals) {
  if (!init(this)) {
    log.i('Config not exist, The "hexo-generator-issues" plugin will not run.');
    return {};
  };

  try {
    const posts = loadPosts(locals);

    const issues = await fetchAllIssues();

    const lastRecords = await loadRecords(posts, issues);
  
    const publishIssues = createPublishIssues(posts, issues, lastRecords);
  
    const publishLogs = await publishAllIssues(publishIssues);
  
    await savePublishLogs(publishLogs, lastRecords);

    return {};

  } catch(err) {
    log.e(err);
    return {};
  }
}

if (process.env.NODE_ENV === "development") {
  generator._inner = {
    init,
    fetchAllIssues,
    loadRecords,
    isPostNeedUpdate,
    isPostNeedCreate,
    loadPosts,
    createPublishIssues,
    createIssueObject,
    pushToGithub,
    publishAllIssues,
    savePublishLogs,
  }
}

module.exports = generator;