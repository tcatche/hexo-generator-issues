import md5 from 'md5';
import Github from './github';
import {
  checkOptions,
  isPostNeedUpdate,
  isPostNeedCreate,
  loadSavedPushHistory,
  saveWillPushedIssues
} from './utils';

const ISSUE_EXIST_STATE = "open";
const TEMPLATE_DEFAULT = '**The original = $$url.**';

class Generator {
  constructor(hexo, locals) {
    this.init(hexo, locals);
  }
  /**
   * init params.
   * @param {any} hexo hexo
   * @returns
   */
  init(hexo, locals) {
    const issuesOption = (hexo.config.deploy || []).find(item => item.type === 'issues');
    checkOptions(issuesOption);

    this.log = hexo.log;
    this.locals = locals;
    this.options = issuesOption;

    if (['top', 'bottom'].includes(issuesOption.sourceLink?.position)) {
      this.options.position = issuesOption.sourceLink.position;
      this.options.template = issuesOption.sourceLink.template || TEMPLATE_DEFAULT;
    }

    // init github api
    this.githubApi = new Github(issuesOption);

    return true;
  }

  /**
   * Load all of the issues from the github repo.
   */
  async fetchAllIssues() {
    const repos = `${this.options.repository.owner}/${this.options.repository.repo}`;
    this.log.i('[generator-issues]: No local record, need fetch issues in github');
    this.log.i('[generator-issues]: Fetching issues in %s...', repos);
    try {
      let issues = await this.githubApi.fetchAllIssues();
      issues = issues.map(item => ({
        title : item.title,
        number: item.number,
        state : item.state
      })).sort((a, b) => a.number - b.number);
      this.log.i('[generator-issues]: Success fetch issues in repository %s, total: %s', repos, issues.length);
      return issues;
    } catch(err) {
      this.log.e('[generator-issues]: Fetch issues Failed!');
      throw(err);
    }
  };

  /**
   * load last time generate history.
   * if there are last time generate records, then just use it and do not check whether the records is valid or not.
   * if there isn't records, then use github issues to create the records.
   *
   * @param {*} posts
   * @param {*} issues
   */
  async loadRecords(posts) {
    let savedRecords = await loadSavedPushHistory();

    // if local not have generate record file, need rebuild.
    const updatedTime = new Date().toUTCString();
    if (!savedRecords || !savedRecords.success) {
      savedRecords = {
        success: {},
        updated: updatedTime,
      };
      const issues = await this.fetchAllIssues();
      if (issues.length > 0) {
        posts.forEach(postItem => {
          let findedIssue = issues.find(issueItem => issueItem.title == postItem.title);
          if (findedIssue) {
            savedRecords.success[postItem.__uid] = {
              id: postItem.__uid,
              number: findedIssue.number,
              title: postItem.title,
              path: postItem.path,
              updated: findedIssue.updated_at || updatedTime,
            }
          }
        });
      }
    }

    if (!savedRecords.updated) {
      savedRecords.updated = savedRecords.updated || updatedTime;
    }

    return savedRecords;
  }

  /**
   * load posts, filter out the post that doesn't need update and sort the rest posts.
   */
  getPosts() {
    this.locals.posts.data.forEach(post => post.__uid = md5(post.path));
    return this.locals.posts.data.sort((a, b) => a.date - b.date);
  }

  /**
   * Create the create and update issues list with this three steps:
   * 1. find all posts that need being updated
   * 2. add new created issue.
   *
   * @param {*} posts
   * @param {*} issues
   * @param {*} lastRecords
   */
  createPushIssues(posts, lastRecords) {
    let pushIssues = [];
    const currentTime = new Date().toUTCString();

    // filter out posts that need being updated or created.
    posts = posts.filter(
      post => {
        return !!post.title && (isPostNeedUpdate(post, lastRecords) || isPostNeedCreate(post, lastRecords))
      }
    ).forEach(post => {
      // add create and update post object
      let _issue = this.createIssueObject(post);
      _issue.number = lastRecords.success[post.__uid]?.number;
      _issue.updated = currentTime;
      pushIssues.push(_issue);
    });

    return pushIssues;
  }

  /**
   * Create issue data object for the post need to be create or update.
   * @param {*} post
   */
  createIssueObject(post) {
    // Add link to point the source post.
    let body = post._content;
    const { position, template } = this.options;
    if (position === 'top') {
      let url = template.replace(/\$\$url/g, `[${post.title}](${post.permalink})`);
      body = `${url}\n\n${body}`;
    } else if (position === 'bottom') {
      let url = template.replace(/\$\$url/g, `[${post.title}](${post.permalink})`);
      body = `${body}\n\n${url}`;
    }

    return {
      title: post.title,
      body,
      labels: (post.tags || []).map(item => item.name),
      state: ISSUE_EXIST_STATE,
      _id: post._id,
      __id: post.__uid,
      path: post.path,
    };
  };

  async run() {
    const posts = this.getPosts();
    const lastSavedRecords = await this.loadRecords(posts);
    const pushIssues = this.createPushIssues(posts, lastSavedRecords);
    await saveWillPushedIssues(pushIssues);
    if (pushIssues.length > 0) {
      const createdCount = pushIssues.filter(item => !item.number).length;
      const updateCount = pushIssues.filter(item => item.number).length;
      this.log.i('[generator-issues]: Success generate %s issues, need create %s and update %s.', pushIssues.length, createdCount, updateCount);
      pushIssues.forEach(item => {
        this.log.i('[generator-issues]: %s [%s]', item.number ? 'Update' : 'Create', item.title);
      });
      this.log.i('[generator-issues]: The saved issues will deploy when run "hexo d" or "hexo deploy".');
    } else {
      this.log.i('[generator-issues]: No issue need create or update.');
    }
  }
}

const generator = async function (hexo, locals) {
  try {
    const _generator = new Generator(hexo, locals);
    await _generator.run();
    return {};
  } catch(err) {
    hexo.log.e('[generator-issues]: ', err);
    return {};
  }
}

module.exports = generator;
