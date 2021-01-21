"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _github = _interopRequireDefault(require("./github"));

var _utils = require("./utils");

var Deployer = /*#__PURE__*/function () {
  function Deployer(hexo) {
    (0, _classCallCheck2["default"])(this, Deployer);
    this.init(hexo);
  }
  /**
   * init params.
   * @param {any} hexo hexo
   * @returns
   */


  (0, _createClass2["default"])(Deployer, [{
    key: "init",
    value: function init(hexo) {
      var issuesOption = (hexo.config.deploy || []).find(function (item) {
        return item.type === 'issues';
      });
      (0, _utils.checkOptions)(issuesOption);
      this.log = hexo.log;
      this.options = issuesOption;
      this.taskLogs = {
        success: {}
      };
    }
  }, {
    key: "saveLog",
    value: function saveLog(issue) {
      var id = issue.__id,
          number = issue.number,
          path = issue.path,
          title = issue.title,
          updated = issue.updated;
      console.log(updated);
      this.taskLogs.success[id] = {
        id: id,
        number: number,
        path: path,
        title: title,
        updated: updated
      };
    }
  }, {
    key: "pushAllIssues",

    /**
     * The task runner to push all issues to github.
     * 1. first, update all issues need to be, when error occurs,it will ignore it.
     * 2. Then, create all issues need to be, when error occurs,it will stop.
     * @param {*} issueList
     */
    value: function () {
      var _pushAllIssues = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(issueList) {
        var _this = this;

        var updateIssueQueue, createIssueQueue, repoString, githubApi, successCreatedIssues, errorCreatedIssues, successUpdatedIssues, errorUpdatedIssues, _yield$githubApi$upda, _yield$githubApi$upda2, _yield$githubApi$crea, _yield$githubApi$crea2;

        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                updateIssueQueue = issueList.filter(function (issue) {
                  return issue.number;
                });
                createIssueQueue = issueList.filter(function (issue) {
                  return !issue.number;
                });
                repoString = "".concat(this.options.repository.owner, "/").concat(this.options.repository.repo); // init github api

                githubApi = new _github["default"](this.options, this.log);
                successCreatedIssues = [], errorCreatedIssues = [], successUpdatedIssues = [], errorUpdatedIssues = [];
                this.log.i("[generator-issues]: [Deploy begin!] update ".concat(updateIssueQueue.length, " and create ").concat(createIssueQueue.length, ".")); // Update issues

                if (!(updateIssueQueue.length > 0)) {
                  _context.next = 13;
                  break;
                }

                _context.next = 9;
                return githubApi.updateIssues(updateIssueQueue, function (successStatus, issue) {
                  if (successStatus) {
                    _this.saveLog(issue);

                    _this.log.i("[generator-issues]: [Update Success!] [title: ".concat(issue.title, "] [url: /").concat(repoString, "/issues/").concat(issue.number, "]"));
                  } else {
                    _this.log.e("[generator-issues]: [Update Failed!] [title: ".concat(issue.title, "] [url: /").concat(repoString, "/issues/").concat(issue.number, "]"));
                  }
                });

              case 9:
                _yield$githubApi$upda = _context.sent;
                _yield$githubApi$upda2 = (0, _slicedToArray2["default"])(_yield$githubApi$upda, 2);
                successUpdatedIssues = _yield$githubApi$upda2[0];
                errorUpdatedIssues = _yield$githubApi$upda2[1];

              case 13:
                if (!(createIssueQueue.length > 0)) {
                  _context.next = 20;
                  break;
                }

                _context.next = 16;
                return githubApi.createIssues(createIssueQueue, function (successStatus, issue) {
                  if (successStatus) {
                    _this.saveLog(issue);

                    _this.log.i("[generator-issues]: [Create Success!] [title: ".concat(issue.title, "] [url: /").concat(repoString, "/issues/").concat(issue.number, "]"));
                  } else {
                    _this.log.e("[generator-issues]: [Create Failed!] [title: ".concat(issue.title, "]:"));
                  }
                });

              case 16:
                _yield$githubApi$crea = _context.sent;
                _yield$githubApi$crea2 = (0, _slicedToArray2["default"])(_yield$githubApi$crea, 2);
                successCreatedIssues = _yield$githubApi$crea2[0];
                errorCreatedIssues = _yield$githubApi$crea2[1];

              case 20:
                return _context.abrupt("return", [this.taskLogs, [successUpdatedIssues, errorUpdatedIssues], [successCreatedIssues, errorCreatedIssues]]);

              case 21:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function pushAllIssues(_x) {
        return _pushAllIssues.apply(this, arguments);
      }

      return pushAllIssues;
    }()
  }, {
    key: "run",
    value: function () {
      var _run = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2() {
        var pushIssues, _yield$this$pushAllIs, _yield$this$pushAllIs2, pushLogs, _yield$this$pushAllIs3, successUpdatedIssues, errorUpdatedIssues, _yield$this$pushAllIs4, successCreatedIssues, errorCreatedIssues;

        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return (0, _utils.loadWillPushedIssues)();

              case 2:
                pushIssues = _context2.sent;

                if (!(pushIssues && pushIssues.length > 0)) {
                  _context2.next = 20;
                  break;
                }

                _context2.next = 6;
                return this.pushAllIssues(pushIssues);

              case 6:
                _yield$this$pushAllIs = _context2.sent;
                _yield$this$pushAllIs2 = (0, _slicedToArray2["default"])(_yield$this$pushAllIs, 3);
                pushLogs = _yield$this$pushAllIs2[0];
                _yield$this$pushAllIs3 = (0, _slicedToArray2["default"])(_yield$this$pushAllIs2[1], 2);
                successUpdatedIssues = _yield$this$pushAllIs3[0];
                errorUpdatedIssues = _yield$this$pushAllIs3[1];
                _yield$this$pushAllIs4 = (0, _slicedToArray2["default"])(_yield$this$pushAllIs2[2], 2);
                successCreatedIssues = _yield$this$pushAllIs4[0];
                errorCreatedIssues = _yield$this$pushAllIs4[1];
                this.log.i("[generator-issues]: [Deploy finish!] [Update Action Success ".concat(successUpdatedIssues.length, ", Fail ").concat(errorUpdatedIssues.length, "] [Create Action Success ").concat(successCreatedIssues.length, ", Fail ").concat(errorCreatedIssues.length, "]"));
                _context2.next = 18;
                return (0, _utils.savePushHistory)(pushLogs);

              case 18:
                _context2.next = 21;
                break;

              case 20:
                this.log.i('[generator-issues]: No issue need to deploy.');

              case 21:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function run() {
        return _run.apply(this, arguments);
      }

      return run;
    }()
  }]);
  return Deployer;
}();

var deployer = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3(hexo) {
    var _deployer;

    return _regenerator["default"].wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.prev = 0;
            _deployer = new Deployer(hexo);
            _context3.next = 4;
            return _deployer.run();

          case 4:
            _context3.next = 9;
            break;

          case 6:
            _context3.prev = 6;
            _context3.t0 = _context3["catch"](0);
            hexo.log.e('[generator-issues]: ', _context3.t0);

          case 9:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, null, [[0, 6]]);
  }));

  return function deployer(_x2) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = deployer;