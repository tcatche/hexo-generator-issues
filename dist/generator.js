"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _moment = _interopRequireDefault(require("moment"));

var _md = _interopRequireDefault(require("md5"));

var _github = _interopRequireDefault(require("./github"));

var _utils = require("./utils");

var ISSUE_EXIST_STATE = "open";
var TEMPLATE_DEFAULT = '**The original = $$url.**';

var Generator = /*#__PURE__*/function () {
  function Generator(hexo, locals) {
    (0, _classCallCheck2["default"])(this, Generator);
    this.init(hexo, locals);
  }
  /**
   * init params.
   * @param {any} hexo hexo
   * @returns
   */


  (0, _createClass2["default"])(Generator, [{
    key: "init",
    value: function init(hexo, locals) {
      var _issuesOption$sourceL;

      var issuesOption = (hexo.config.deploy || []).find(function (item) {
        return item.type === 'issues';
      });
      (0, _utils.checkOptions)(issuesOption);
      this.log = hexo.log;
      this.locals = locals;
      this.options = issuesOption;

      if (['top', 'bottom'].includes((_issuesOption$sourceL = issuesOption.sourceLink) === null || _issuesOption$sourceL === void 0 ? void 0 : _issuesOption$sourceL.position)) {
        this.options.position = issuesOption.sourceLink.position;
        this.options.template = issuesOption.sourceLink.template || TEMPLATE_DEFAULT;
      } // init github api


      this.githubApi = new _github["default"](issuesOption);
      return true;
    }
    /**
     * Load all of the issues from the github repo.
     */

  }, {
    key: "fetchAllIssues",
    value: function () {
      var _fetchAllIssues = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
        var repos, issues;
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                repos = "".concat(this.options.repository.owner, "/").concat(this.options.repository.repo);
                this.log.i('[generator-issues]: No local record, need fetch issues in github');
                this.log.i('[generator-issues]: Fetching issues in %s...', repos);
                _context.prev = 3;
                _context.next = 6;
                return this.githubApi.fetchAllIssues();

              case 6:
                issues = _context.sent;
                issues = issues.map(function (item) {
                  return {
                    title: item.title,
                    number: item.number,
                    state: item.state
                  };
                }).sort(function (a, b) {
                  return a.number - b.number;
                });
                this.log.i('[generator-issues]: Success fetch issues in repository %s, total: %s', repos, issues.length);
                return _context.abrupt("return", issues);

              case 12:
                _context.prev = 12;
                _context.t0 = _context["catch"](3);
                this.log.e('[generator-issues]: Fetch issues Failed!');
                throw _context.t0;

              case 16:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this, [[3, 12]]);
      }));

      function fetchAllIssues() {
        return _fetchAllIssues.apply(this, arguments);
      }

      return fetchAllIssues;
    }()
  }, {
    key: "loadRecords",

    /**
     * load last time generate history.
     * if there are last time generate records, then just use it and do not check whether the records is valid or not.
     * if there isn't records, then use github issues to create the records.
     *
     * @param {*} posts
     * @param {*} issues
     */
    value: function () {
      var _loadRecords = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(posts) {
        var savedRecords, updatedTime, issues;
        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return (0, _utils.loadSavedPushHistory)();

              case 2:
                savedRecords = _context2.sent;
                // if local not have generate record file, need rebuild.
                updatedTime = (0, _moment["default"])(0).format();

                if (!(!savedRecords || !savedRecords.success)) {
                  _context2.next = 10;
                  break;
                }

                savedRecords = {
                  success: {},
                  updated: updatedTime
                };
                _context2.next = 8;
                return this.fetchAllIssues();

              case 8:
                issues = _context2.sent;

                if (issues.length > 0) {
                  posts.forEach(function (postItem) {
                    var findedIssue = issues.find(function (issueItem) {
                      return issueItem.title == postItem.title;
                    });

                    if (findedIssue) {
                      savedRecords.success[postItem.__uid] = {
                        id: postItem.__uid,
                        number: findedIssue.number,
                        title: postItem.title,
                        path: postItem.path,
                        updated: updatedTime
                      };
                    }
                  });
                }

              case 10:
                if (!savedRecords.updated) {
                  savedRecords.updated = updatedTime;
                }

                return _context2.abrupt("return", savedRecords);

              case 12:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function loadRecords(_x) {
        return _loadRecords.apply(this, arguments);
      }

      return loadRecords;
    }()
    /**
     * load posts, filter out the post that doesn't need update and sort the rest posts.
     */

  }, {
    key: "getPosts",
    value: function getPosts() {
      this.locals.posts.data.forEach(function (post) {
        return post.__uid = (0, _md["default"])(post.path);
      });
      return this.locals.posts.data.sort(function (a, b) {
        return a.date - b.date;
      });
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

  }, {
    key: "createPushIssues",
    value: function createPushIssues(posts, lastRecords) {
      var _this = this;

      var pushIssues = [];
      var updatedTime = (0, _moment["default"])().format(); // filter out posts that need being updated or created.

      posts = posts.filter(function (post) {
        return !!post.title && ((0, _utils.isPostNeedUpdate)(post, lastRecords) || (0, _utils.isPostNeedCreate)(post, lastRecords));
      }).forEach(function (post) {
        var _lastRecords$success$;

        // add create and update post object
        var _issue = _this.createIssueObject(post);

        _issue.number = (_lastRecords$success$ = lastRecords.success[post.__uid]) === null || _lastRecords$success$ === void 0 ? void 0 : _lastRecords$success$.number;
        _issue.updated = updatedTime;
        pushIssues.push(_issue);
      });
      return pushIssues;
    }
    /**
     * Create issue data object for the post need to be create or update.
     * @param {*} post
     */

  }, {
    key: "createIssueObject",
    value: function createIssueObject(post) {
      // Add link to point the source post.
      var body = post._content;
      var _this$options = this.options,
          position = _this$options.position,
          template = _this$options.template;

      if (position === 'top') {
        var url = template.replace(/\$\$url/g, "[".concat(post.title, "](").concat(post.permalink, ")"));
        body = "".concat(url, "\n\n").concat(body);
      } else if (position === 'bottom') {
        var _url = template.replace(/\$\$url/g, "[".concat(post.title, "](").concat(post.permalink, ")"));

        body = "".concat(body, "\n\n").concat(_url);
      }

      return {
        title: post.title,
        body: body,
        labels: (post.tags || []).map(function (item) {
          return item.name;
        }),
        state: ISSUE_EXIST_STATE,
        __id: post.__uid,
        path: post.path
      };
    }
  }, {
    key: "run",
    value: function () {
      var _run = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3() {
        var posts, lastSavedRecords, pushIssues;
        return _regenerator["default"].wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                posts = this.getPosts();
                _context3.next = 3;
                return this.loadRecords(posts);

              case 3:
                lastSavedRecords = _context3.sent;
                pushIssues = this.createPushIssues(posts, lastSavedRecords);
                _context3.next = 7;
                return (0, _utils.saveWillPushedIssues)(pushIssues);

              case 7:
                if (pushIssues.length > 0) {
                  this.log.i('[generator-issues]: Success generate %s issues need create or update.', pushIssues.length);
                  this.log.i('[generator-issues]: The saved issues will deploy when run "hexo d" or "hexo deploy".');
                } else {
                  this.log.i('[generator-issues]: No issue need create or update.');
                }

              case 8:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function run() {
        return _run.apply(this, arguments);
      }

      return run;
    }()
  }]);
  return Generator;
}();

var generator = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4(hexo, locals) {
    var _generator;

    return _regenerator["default"].wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.prev = 0;
            _generator = new Generator(hexo, locals);
            _context4.next = 4;
            return _generator.run();

          case 4:
            return _context4.abrupt("return", {});

          case 7:
            _context4.prev = 7;
            _context4.t0 = _context4["catch"](0);
            hexo.log.e('[generator-issues]: ', _context4.t0);
            return _context4.abrupt("return", {});

          case 11:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4, null, [[0, 7]]);
  }));

  return function generator(_x2, _x3) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = generator;