import moment from 'moment';
import fs from 'hexo-fs';

const ISSUE_UPDATE_RECORDS_PATH = './_issue_generator_record.json';
const ISSUE_GENERATOR_PATH = './_issue_generator_data.json';

/**
 * If the post need to be updated to github issue.
 * @param {*} post
 * @param {*} lastPushedRecords
 */
export const isPostNeedUpdate = (post, lastPushedRecords) => {
  const isPostSaved = post.__uid in lastPushedRecords.success;
  const isUpdate = isPostSaved && (moment(lastPushedRecords.success[post.__uid].updated || lastPushedRecords.updated) < moment(post.updated));
  console.log(post.__uid, lastPushedRecords.success[post.__uid], lastPushedRecords.success[post.__uid].updated, post.updated, isPostSaved && isUpdate)
  return isPostSaved && isUpdate;
}


/**
 * If the post have created an issus.
 * @param {*} post
 * @param {*} lastPushedRecords
 */
export const isPostNeedCreate = (post, lastPushedRecords) => !(post.__uid in lastPushedRecords.success);

export const checkOptions = (issuesOption) => {
  if (!issuesOption || !issuesOption.repository || !issuesOption.auth) {
    throw new Error(`
    The hexo-generate-issues plugins need auth and repository options.
    Some of the options is not exist, so the plugin will not run.
    Example:
    deploy:
      - type: issues
        auth: <github token>
        repository:
          owner: <userName>
          repo: <repositoryName>
    For more help, you can check the docs: https://www.npmjs.com/package/hexo-generator-issues.
  `);
  }
}

/**
 * Save the post issues need to be create or updated on github
 */
export const saveWillPushedIssues = (pushData) => {
  return fs.writeFile(ISSUE_GENERATOR_PATH, JSON.stringify(pushData));
}

/**
 * load the post issues need to be create or updated on github
 */
export const loadWillPushedIssues = async () => {
  const isFileExist = await fs.exists(ISSUE_GENERATOR_PATH);
  let savedRecords;
  if (isFileExist) {
    savedRecords = await fs.readFile(ISSUE_GENERATOR_PATH).then(content => {
      return !!content ? JSON.parse(content) : undefined;
    });
  }
  return savedRecords;
};

/**
 * load last time saved push issue history.
 */
export const loadSavedPushHistory = async () => {
  const isRecordFileExist = await fs.exists(ISSUE_UPDATE_RECORDS_PATH);
  let savedRecords = {};
  if (isRecordFileExist) {
    savedRecords = await fs.readFile(ISSUE_UPDATE_RECORDS_PATH).then(content => {
      return !!content ? JSON.parse(content) : {};
    }) || {};
  }
  return savedRecords;
}


/**
 * save push history to local file.
 * The history will reduce next push cost.
 * @param {*} logs
 */
export const savePushHistory = async (logs) => {
  const lastSavedHistory = await loadSavedPushHistory;
  let records = {
    success: Object.assign({}, lastSavedHistory.success, logs.success),
    updated: moment().format()
  }

  await fs.writeFile(ISSUE_UPDATE_RECORDS_PATH, JSON.stringify(records));
}