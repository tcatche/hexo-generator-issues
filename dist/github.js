"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _rest = require("@octokit/rest");

var _pluginRetry = require("@octokit/plugin-retry");

var _pluginThrottling = require("@octokit/plugin-throttling");

function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

var MyOctokit = _rest.Octokit.plugin(_pluginRetry.retry, _pluginThrottling.throttling);

var PER_PAGE_ISSUE = 50;
var CONNECT_GITHUB_TIMEOUT = 15000;
var CREATE_ISSUE_INTERVAL = 2000;

var Github = /*#__PURE__*/function () {
  function Github(options, logger) {
    (0, _classCallCheck2["default"])(this, Github);
    this.options = options;
    this.octokit = new MyOctokit({
      debug: true,
      auth: options.auth,
      baseUrl: 'https://api.github.com',
      // should be api.github.com for GitHub
      userAgent: "hexo-igenerator-issue",
      // GitHub is happy with a unique user agent
      request: {
        timeout: CONNECT_GITHUB_TIMEOUT
      },
      throttle: {
        onRateLimit: function onRateLimit(retryAfter, options) {
          myOctokit.log.warn("Request quota exhausted for request ".concat(options.method, " ").concat(options.url));

          if (options.request.retryCount === 0) {
            // only retries once
            myOctokit.log.info("Retrying after ".concat(retryAfter, " seconds!"));
            return true;
          }
        },
        onAbuseLimit: function onAbuseLimit(retryAfter, options) {
          // does not retry, only logs a warning
          myOctokit.log.warn("Abuse detected for request ".concat(options.method, " ").concat(options.url));
        }
      },
      retry: {
        doNotRetry: ["429"]
      }
    });
    this.logger = logger;
  }
  /**
   * get the page issues from github.
   * @param {number} page
   * @param {number} per_page
   * @returns {Promise}
   */


  (0, _createClass2["default"])(Github, [{
    key: "fetchIssuesByPage",
    value: function fetchIssuesByPage() {
      var page = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
      var per_page = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : PER_PAGE_ISSUE;
      var _this$options$reposit = this.options.repository,
          owner = _this$options$reposit.owner,
          repo = _this$options$reposit.repo;
      return this.octokit.issues.listForRepo({
        page: page,
        per_page: per_page,
        owner: owner,
        repo: repo,
        state: 'all'
      });
    }
    /**
     * get all issues from github.
     * @param {number} page
     * @param {number} per_page
     * @returns {array} data
     */

  }, {
    key: "fetchAllIssues",
    value: function () {
      var _fetchAllIssues = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
        var currentPage, response, _response, data;

        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!this.savedIssues) {
                  _context.next = 2;
                  break;
                }

                return _context.abrupt("return", this.savedIssues);

              case 2:
                currentPage = 1;
                _context.next = 5;
                return this.fetchIssuesByPage(currentPage);

              case 5:
                response = _context.sent;
                _response = response, data = _response.data;

              case 7:
                if (!(data.length === PER_PAGE_ISSUE * currentPage)) {
                  _context.next = 15;
                  break;
                }

                currentPage += 1;
                _context.next = 11;
                return this.fetchIssuesByPage(currentPage);

              case 11:
                response = _context.sent;
                data = data.concat(response.data);
                _context.next = 7;
                break;

              case 15:
                this.savedIssues = data;
                return _context.abrupt("return", data);

              case 17:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function fetchAllIssues() {
        return _fetchAllIssues.apply(this, arguments);
      }

      return fetchAllIssues;
    }()
    /**
     * push a issue to github.
     * It use issue.number to decide whether to create or update a github issue.
     * @param {*} issue object, create from createIssueObject function.
     * @returns {Promise}
     */

  }, {
    key: "pushIssue",
    value: function pushIssue(issue) {
      var issueParams = _objectSpread(_objectSpread(_objectSpread({}, issue), this.options.repository), {}, {
        issue_number: issue.number
      });

      if (issue.number) {
        // return this.octokit.issues.update(issueParams);
        return this.octokit.issues.update(issueParams);
      } else {
        // return this.octokit.issues.create(issueParams);
        return this.octokit.issues.create(issueParams);
      }
    }
  }, {
    key: "updateIssues",
    value: function () {
      var _updateIssues = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(issueList, afterUpdateOne) {
        var successed, errored, _iterator, _step, issue, successStatus;

        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                successed = [];
                errored = []; // Update issues concurrently.
                // when error occurs, still update other issues.

                _iterator = _createForOfIteratorHelper(issueList);
                _context2.prev = 3;

                _iterator.s();

              case 5:
                if ((_step = _iterator.n()).done) {
                  _context2.next = 21;
                  break;
                }

                issue = _step.value;
                successStatus = true;
                _context2.prev = 8;
                _context2.next = 11;
                return this.pushIssue(issue);

              case 11:
                successed.push(issue);
                _context2.next = 18;
                break;

              case 14:
                _context2.prev = 14;
                _context2.t0 = _context2["catch"](8);
                errored.push(issue);
                successStatus = false;

              case 18:
                afterUpdateOne === null || afterUpdateOne === void 0 ? void 0 : afterUpdateOne(successStatus, issue);

              case 19:
                _context2.next = 5;
                break;

              case 21:
                _context2.next = 26;
                break;

              case 23:
                _context2.prev = 23;
                _context2.t1 = _context2["catch"](3);

                _iterator.e(_context2.t1);

              case 26:
                _context2.prev = 26;

                _iterator.f();

                return _context2.finish(26);

              case 29:
                return _context2.abrupt("return", [successed, errored]);

              case 30:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this, [[3, 23, 26, 29], [8, 14]]);
      }));

      function updateIssues(_x, _x2) {
        return _updateIssues.apply(this, arguments);
      }

      return updateIssues;
    }()
    /**
     * The task runner to push all issues to github.
     * 1. first, update all issues need to be, when error occurs,it will ignore it.
     * 2. Then, create all issues need to be, when error occurs,it will stop.
     * @param {*} issueList
     * @param {*} afterUpdateOne
     */

  }, {
    key: "createIssues",
    value: function () {
      var _createIssues = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3(issueList, afterUpdateOne) {
        var successed, errored, _iterator2, _step2, issue, successStatus, res;

        return _regenerator["default"].wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                successed = [];
                errored = []; // Create issues serially.

                _iterator2 = _createForOfIteratorHelper(issueList);
                _context3.prev = 3;

                _iterator2.s();

              case 5:
                if ((_step2 = _iterator2.n()).done) {
                  _context3.next = 26;
                  break;
                }

                issue = _step2.value;
                successStatus = true;
                _context3.prev = 8;
                _context3.next = 11;
                return this.pushIssue(issue);

              case 11:
                res = _context3.sent;
                issue.number = res.data.number;
                successed.push(issue);
                _context3.next = 21;
                break;

              case 16:
                _context3.prev = 16;
                _context3.t0 = _context3["catch"](8);
                errored.push(issue);
                successStatus = false;
                console.error(_context3.t0);

              case 21:
                afterUpdateOne === null || afterUpdateOne === void 0 ? void 0 : afterUpdateOne(successStatus, issue);
                _context3.next = 24;
                return new Promise(function (resolve) {
                  setTimeout(resolve, CREATE_ISSUE_INTERVAL);
                });

              case 24:
                _context3.next = 5;
                break;

              case 26:
                _context3.next = 31;
                break;

              case 28:
                _context3.prev = 28;
                _context3.t1 = _context3["catch"](3);

                _iterator2.e(_context3.t1);

              case 31:
                _context3.prev = 31;

                _iterator2.f();

                return _context3.finish(31);

              case 34:
                return _context3.abrupt("return", [successed, errored]);

              case 35:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this, [[3, 28, 31, 34], [8, 16]]);
      }));

      function createIssues(_x3, _x4) {
        return _createIssues.apply(this, arguments);
      }

      return createIssues;
    }()
  }]);
  return Github;
}();

exports["default"] = Github;