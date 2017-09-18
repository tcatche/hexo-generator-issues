'use strict';

module.exports = function (post) {
  var hexo = this;
  var config = hexo.config;
  var TEMPLATE_DEFAULT = '****Have any question? go to github issue to discuss: $$url.**';
  var ISSUE_META_KEY = 'issueNumber';

  var issueNumber = post[ISSUE_META_KEY];
  if (issueNumber == 0 || !post.title) {
    return post;
  }

  var option = config.issues;
  if (!option || !option.repository || !option.auth || !option.repository.owner || !option.repository.repo) {
    return post;
  }

  if (option.issueLink && option.issueLink.position) {
    if (option.issueLink.position == 'top' || option.issueLink.position == 'bottom') {
      option.position = option.issueLink.position, option.template = option.issueLink.template || TEMPLATE_DEFAULT;
    } else {
      return post;
    }
  }

  var body = post.content;
  var issueLink = 'https://github.com/' + option.repository.owner + '/' + option.repository.repo + '/issues/' + issueNumber;
  console.log(issueLink);
  if (option.position && option.position == 'top') {
    var url = option.template.replace(/\$\$url/g, '[' + post.title + '](' + issueLink + ')');
    body = url + '\n\n' + body;
  } else if (option.position && option.position == 'bottom') {
    var _url = option.template.replace(/\$\$url/g, '[' + post.title + '](' + issueLink + ')');
    body = body + '\n\n' + _url;
  }
  post.content = body;
  return post;
};