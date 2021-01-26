"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.savePushHistory = exports.loadSavedPushHistory = exports.loadWillPushedIssues = exports.saveWillPushedIssues = exports.checkOptions = exports.isPostNeedCreate = exports.isPostNeedUpdate = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _hexoFs = _interopRequireDefault(require("hexo-fs"));

var ISSUE_UPDATE_RECORDS_PATH = './_issue_generator_record.json';
var ISSUE_GENERATOR_PATH = './_issue_generator_data.json';
/**
 * If the post need to be updated to github issue.
 * @param {*} post
 * @param {*} lastPushedRecords
 */

var isPostNeedUpdate = function isPostNeedUpdate(post, lastPushedRecords) {
  var isPostSaved = (post.__uid in lastPushedRecords.success);
  var isUpdate = isPostSaved && new Date(lastPushedRecords.success[post.__uid].updated || lastPushedRecords.updated) < new Date(post.updated);
  return isPostSaved && isUpdate;
};
/**
 * If the post have created an issus.
 * @param {*} post
 * @param {*} lastPushedRecords
 */


exports.isPostNeedUpdate = isPostNeedUpdate;

var isPostNeedCreate = function isPostNeedCreate(post, lastPushedRecords) {
  return !(post.__uid in lastPushedRecords.success);
};

exports.isPostNeedCreate = isPostNeedCreate;

var checkOptions = function checkOptions(issuesOption) {
  if (!issuesOption || !issuesOption.repository || !issuesOption.auth) {
    throw new Error("\n    The hexo-generate-issues plugins need auth and repository options.\n    Some of the options is not exist, so the plugin will not run.\n    Example:\n    deploy:\n      - type: issues\n        auth: <github token>\n        repository:\n          owner: <userName>\n          repo: <repositoryName>\n    For more help, you can check the docs: https://www.npmjs.com/package/hexo-generator-issues.\n  ");
  }
};
/**
 * Save the post issues need to be create or updated on github
 */


exports.checkOptions = checkOptions;

var saveWillPushedIssues = function saveWillPushedIssues(pushData) {
  return _hexoFs["default"].writeFile(ISSUE_GENERATOR_PATH, pushData ? JSON.stringify(pushData) : '');
};
/**
 * load the post issues need to be create or updated on github
 */


exports.saveWillPushedIssues = saveWillPushedIssues;

var loadWillPushedIssues = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
    var isFileExist, savedRecords;
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return _hexoFs["default"].exists(ISSUE_GENERATOR_PATH);

          case 2:
            isFileExist = _context.sent;

            if (!isFileExist) {
              _context.next = 7;
              break;
            }

            _context.next = 6;
            return _hexoFs["default"].readFile(ISSUE_GENERATOR_PATH).then(function (content) {
              return !!content ? JSON.parse(content) : undefined;
            });

          case 6:
            savedRecords = _context.sent;

          case 7:
            return _context.abrupt("return", savedRecords);

          case 8:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));

  return function loadWillPushedIssues() {
    return _ref.apply(this, arguments);
  };
}();
/**
 * load last time saved push issue history.
 */


exports.loadWillPushedIssues = loadWillPushedIssues;

var loadSavedPushHistory = /*#__PURE__*/function () {
  var _ref2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2() {
    var isRecordFileExist, savedRecords;
    return _regenerator["default"].wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return _hexoFs["default"].exists(ISSUE_UPDATE_RECORDS_PATH);

          case 2:
            isRecordFileExist = _context2.sent;
            savedRecords = {};

            if (!isRecordFileExist) {
              _context2.next = 11;
              break;
            }

            _context2.next = 7;
            return _hexoFs["default"].readFile(ISSUE_UPDATE_RECORDS_PATH).then(function (content) {
              return !!content ? JSON.parse(content) : {};
            });

          case 7:
            _context2.t0 = _context2.sent;

            if (_context2.t0) {
              _context2.next = 10;
              break;
            }

            _context2.t0 = {};

          case 10:
            savedRecords = _context2.t0;

          case 11:
            return _context2.abrupt("return", savedRecords);

          case 12:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));

  return function loadSavedPushHistory() {
    return _ref2.apply(this, arguments);
  };
}();
/**
 * save push history to local file.
 * The history will reduce next push cost.
 * @param {*} logs
 */


exports.loadSavedPushHistory = loadSavedPushHistory;

var savePushHistory = /*#__PURE__*/function () {
  var _ref3 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3(logs) {
    var lastSavedHistory, records;
    return _regenerator["default"].wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 2;
            return loadSavedPushHistory();

          case 2:
            lastSavedHistory = _context3.sent;
            records = {
              success: Object.assign({}, lastSavedHistory.success, logs.success)
            };
            Object.values(records.success).forEach(function (record) {
              if (!record.updated) {
                record.updated = lastSavedHistory.updated;
              }
            });
            _context3.next = 7;
            return _hexoFs["default"].writeFile(ISSUE_UPDATE_RECORDS_PATH, JSON.stringify(records));

          case 7:
            _context3.next = 9;
            return saveWillPushedIssues();

          case 9:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3);
  }));

  return function savePushHistory(_x) {
    return _ref3.apply(this, arguments);
  };
}();

exports.savePushHistory = savePushHistory;