
var generator = require('../src/generator');
var GitHubApi = require("github");

var option = {
  auth: {
    type: "",
    token: "",
  }, 
  repository: {
    owner: 'tcatche',
    repo: '__hexo-igenerator-issue-test'
  }
};

let date = 1;

// Simulate the hexo run environment.
var g = {
  locals: {
    posts: [],
    pages: [],
    _addPost : function(index) {
      this.posts.push({
        title: `title${index}`,
        _content: `content${index}`,
        tags: [{name: `label${index}`}],
        date: date++
      });
    }
  },
  config: {
    issues: option
  },
  log: {
    i: () => {},
    e: console.error
  },
  generator: generator,
  github: new GitHubApi({
    debug: false,
    protocol: "https",
    host: "api.github.com", // should be api.github.com for GitHub
    headers: {
      "user-agent": "hexo-igenerator-issue-test" // GitHub is happy with a unique user agent
    },
  })
}

module.exports = g;