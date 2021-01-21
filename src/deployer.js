import Github from './github';
import { checkOptions, loadWillPushedIssues, savePushHistory } from './utils';

class Deployer {
  constructor(hexo) {
    this.init(hexo);
  }
  /**
   * init params.
   * @param {any} hexo hexo
   * @returns
   */
  init(hexo) {
    const issuesOption = (hexo.config.deploy || []).find(item => item.type === 'issues');
    checkOptions(issuesOption);

    this.log = hexo.log;
    this.options = issuesOption;
    this.taskLogs = {
      success: {},
    };
  }

  saveLog(issue) {
    const { __id: id, number, path, title, updated} = issue;
    console.log(updated)
    this.taskLogs.success[id] = {
      id,
      number,
      path,
      title,
      updated,
    }
  };

  /**
   * The task runner to push all issues to github.
   * 1. first, update all issues need to be, when error occurs,it will ignore it.
   * 2. Then, create all issues need to be, when error occurs,it will stop.
   * @param {*} issueList
   */
  async pushAllIssues(issueList) {
    const updateIssueQueue = issueList.filter(issue => issue.number);
    const createIssueQueue = issueList.filter(issue => !issue.number);
    const repoString = `${this.options.repository.owner}/${this.options.repository.repo}`;
    // init github api
    const githubApi = new Github(this.options, this.log);
    let successCreatedIssues = [], errorCreatedIssues = [], successUpdatedIssues = [], errorUpdatedIssues = [];

    this.log.i(`[generator-issues]: [Deploy begin!] update ${updateIssueQueue.length} and create ${createIssueQueue.length}.`);

    // Update issues
    if (updateIssueQueue.length > 0) {
      [successUpdatedIssues, errorUpdatedIssues] = await githubApi.updateIssues(updateIssueQueue, (successStatus, issue) => {
        if (successStatus) {
          this.saveLog(issue);
          this.log.i(`[generator-issues]: [Update Success!] [title: ${issue.title}] [url: /${repoString}/issues/${issue.number}]`);
        } else {
          this.log.e(`[generator-issues]: [Update Failed!] [title: ${issue.title}] [url: /${repoString}/issues/${issue.number}]`);
        }
      });
    }

    // Create issues
    if (createIssueQueue.length > 0) {
      [successCreatedIssues, errorCreatedIssues] = await githubApi.createIssues(createIssueQueue, (successStatus, issue) => {
        if (successStatus) {
          this.saveLog(issue);
          this.log.i(`[generator-issues]: [Create Success!] [title: ${issue.title}] [url: /${repoString}/issues/${issue.number}]`);
        } else {
          this.log.e(`[generator-issues]: [Create Failed!] [title: ${issue.title}]:`);
        }
      });
    }

    return [this.taskLogs, [successUpdatedIssues, errorUpdatedIssues], [successCreatedIssues, errorCreatedIssues]];
  };

  async run() {
    const pushIssues = await loadWillPushedIssues();
    if (pushIssues && pushIssues.length > 0) {
      const [pushLogs, [successUpdatedIssues, errorUpdatedIssues], [successCreatedIssues, errorCreatedIssues]] = await this.pushAllIssues(pushIssues);
      this.log.i(`[generator-issues]: [Deploy finish!] [Update Action Success ${successUpdatedIssues.length}, Fail ${errorUpdatedIssues.length}] [Create Action Success ${successCreatedIssues.length}, Fail ${errorCreatedIssues.length}]`);
      await savePushHistory(pushLogs);
    } else {
      this.log.i('[generator-issues]: No issue need to deploy.');
    }
  }
}

const deployer = async function (hexo) {
  try {
    const _deployer = new Deployer(hexo);
    await _deployer.run();
  } catch(err) {
    hexo.log.e('[generator-issues]: ', err);
  }
}
module.exports = deployer;
