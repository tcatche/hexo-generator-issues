import { Octokit } from "@octokit/rest";
import { retry } from "@octokit/plugin-retry";
import { throttling } from "@octokit/plugin-throttling";

const MyOctokit = Octokit.plugin(retry, throttling);
const PER_PAGE_ISSUE = 50;
const CONNECT_GITHUB_TIMEOUT = 15000;
const CREATE_ISSUE_INTERVAL = 2000;

export default class Github {
  constructor(options, logger) {
    this.options = options;
    this.octokit = new MyOctokit({
      debug: true,
      auth: options.auth,
      baseUrl: 'https://api.github.com', // should be api.github.com for GitHub
      userAgent: "hexo-igenerator-issue", // GitHub is happy with a unique user agent
      request: {
        timeout: CONNECT_GITHUB_TIMEOUT
      },
      throttle: {
        onRateLimit: (retryAfter, options) => {
          myOctokit.log.warn(
            `Request quota exhausted for request ${options.method} ${options.url}`
          );

          if (options.request.retryCount === 0) {
            // only retries once
            myOctokit.log.info(`Retrying after ${retryAfter} seconds!`);
            return true;
          }
        },
        onAbuseLimit: (retryAfter, options) => {
          // does not retry, only logs a warning
          myOctokit.log.warn(
            `Abuse detected for request ${options.method} ${options.url}`
          );
        },
      },
      retry: {
        doNotRetry: ["429"],
      },
    });
    this.logger = logger;
  }

  /**
   * get the page issues from github.
   * @param {number} page
   * @param {number} per_page
   * @returns {Promise}
   */
  fetchIssuesByPage(page = 1, per_page = PER_PAGE_ISSUE) {
    const { owner, repo } = this.options.repository;
    return this.octokit.issues.listForRepo({
      page,
      per_page,
      owner,
      repo,
      state: 'all',
    });
  }

  /**
   * get all issues from github.
   * @param {number} page
   * @param {number} per_page
   * @returns {array} data
   */
  async fetchAllIssues() {
    if (this.savedIssues) {
      return this.savedIssues;
    }
    let currentPage = 1;
    let response = await this.fetchIssuesByPage(currentPage);
    let { data } = response;
    while(data.length === PER_PAGE_ISSUE * currentPage) {
      currentPage += 1;
      response = await this.fetchIssuesByPage(currentPage);
      data = data.concat(response.data);
    }
    this.savedIssues = data;
    return data;
  }

  /**
   * push a issue to github.
   * It use issue.number to decide whether to create or update a github issue.
   * @param {*} issue object, create from createIssueObject function.
   * @returns {Promise}
   */
  pushIssue(issue) {
    let issueParams = {
      ...issue,
      ...this.options.repository,
      issue_number: issue.number,
    };
    if (issue.number) {
      // return this.octokit.issues.update(issueParams);
      return this.octokit.issues.update(issueParams);
    } else {
      // return this.octokit.issues.create(issueParams);
      return this.octokit.issues.create(issueParams);
    }
  }

  async updateIssues(issueList, afterUpdateOne) {
    const successed = [];
    const errored = [];

    // Update issues concurrently.
    // when error occurs, still update other issues.
    for (const issue of issueList) {
      let successStatus = true;
      try {
        await this.pushIssue(issue);
        successed.push(issue);
      } catch(err) {
        errored.push(issue);
        successStatus = false;
      }
      afterUpdateOne?.(successStatus, issue);
    }

    return [successed, errored];
  }
  /**
   * The task runner to push all issues to github.
   * 1. first, update all issues need to be, when error occurs,it will ignore it.
   * 2. Then, create all issues need to be, when error occurs,it will stop.
   * @param {*} issueList
   * @param {*} afterUpdateOne
   */
  async createIssues(issueList, afterUpdateOne) {
    const successed = [];
    const errored = [];

    // Create issues serially.
    for (const issue of issueList) {
      let successStatus = true;
      try {
        const res = await this.pushIssue(issue);
        issue.number = res.data.number;
        successed.push(issue);
      } catch(err) {
        errored.push(issue);
        successStatus = false;
        console.error(err);
      }
      afterUpdateOne?.(successStatus, issue);
      await new Promise((resolve) => {
        setTimeout(resolve, CREATE_ISSUE_INTERVAL);
      });
    }

    return [successed, errored];
  };
}