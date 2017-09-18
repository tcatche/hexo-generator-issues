module.exports = function (post) {
  const hexo = this;
  const config = hexo.config;
  const TEMPLATE_DEFAULT = '****Have any question? go to github issue to discuss: $$url.**';
  const ISSUE_META_KEY = 'issueNumber';

  let issueNumber = post[ISSUE_META_KEY];
  if (issueNumber == 0 || !post.title) {
    return post;
  }

  let option = config.issues;
  if (!option || !option.repository || !option.auth || !option.repository.owner || !option.repository.repo) {
    return post;
  }

  if (option.issueLink && option.issueLink.position) {
    if (option.issueLink.position == 'top' || option.issueLink.position == 'bottom') {
      option.position = option.issueLink.position,
      option.template = option.issueLink.template || TEMPLATE_DEFAULT
    } else {
      return post;
    }
  }

  let body = post.content;
  let issueLink = `https://github.com/${option.repository.owner}/${option.repository.repo}/issues/${issueNumber}`;
  console.log(issueLink)
  if (option.position && option.position == 'top') {
    let url = option.template.replace(/\$\$url/g, `[${post.title}](${issueLink})`);
    body = `${url}\n\n${body}`;
  } else if (option.position && option.position == 'bottom') {
    let url = option.template.replace(/\$\$url/g, `[${post.title}](${issueLink})`);
    body = `${body}\n\n${url}`;
  }
  post.content = body;
  return post;
};

