# hexo-generator-issues

[中文文档](/README-zh.md)

This plugin publishes articles to github specified repository, and each article as an issue.

## install

```
npm install hexo-generator-issues@beta --save
```

## run

The plugin takes effect in the process of executing `generate`, that is, when the` hexo g` or `hexo generate` is executed, the publish progress will execute.

```js
hexo generate 
// or
hexo g
```

After the release, the plugin will generate a `_issue_generator_record'` file in the blog directory. this file records the contents of the current release, please **do not delete this file**.
this will ensure the next publish only publish the smallest changes, or the next publish will re-publish all the articles. This will cost a lot of time to publish your articles.

## Configuration
Add the following content in your configuration file (`_config.yml`):

```yml
issues:
  # github certification, when submit the issue used it
  auth:
    # Authentication type, more authentication information goto：https://github.com/mikedeboer/node-github#authentication
    type: 
    # Use token authentication to provide token
    token: 
    # Use client keys authentication to provide id and secret
    id:
    secret: 
    # Use credentials to provide username and password
    username:
    password:

  # Provide a repository that needs to be placed issues
  repository:
    owner:  # github username
    repo: # Specifies the repository under the user name, and the repository must exist

  # In the issue to increase the original address of the blog reference, the corresponding address is post.permalink
  sourceLink: 
    # blog address information at the beginning (`top`, default) or end (` bottom`), 
    # use other values ​​to ignore the configuration
    position: 'top' 
    # The original message format, the default is `The default template is 'The original: $$url.**`， 
    # $$url`  is the placeholder for the url of the blog，corresponding to markdown： `[${post.title}](${post.permalink})`
    template: 'The original: $$url.**`. `$$url' 
```

The original configuration `issueLink` is temporarily deleted and will be re-enabled in later version.

**Note**, the ~~issueNumber~~ metadata parameters are no longer effective, no longer work:

```
---
title: The post's title
...
issueNumber: 1 //this line no longer work
...
---
```

## Test
// todo 

## Problem

### Publish slow

> Requests that create content which triggers notifications, such as issues, comments and pull requests, may be further limited and will not include a Retry-After header in the response. Please create this content at a reasonable pace to avoid further limiting.

Since the interface provided by github limits the rate when the issue was created (moew info see: [dealing-with-abuse-rate-limits] (https://developer.github.com/v3/guides/best-practices-for-integrators/ # dealing-with-abuse-rate-limits). So the time interval for creating the issue is set to 2000 ms, which results in a very slow execution of the task when create many issues, and may also occur as follows problem:

```
HTTP/1.1 403 Forbidden
Content-Type: application/json; charset=utf-8
Connection: close

{
  "message": "You have triggered an abuse detection mechanism and have been temporarily blocked from content creation. Please retry your request again later.",
  "documentation_url": "https://developer.github.com/v3#abuse-rate-limits"
}
```

In this case, you can re-execute the command at a later time.

For more information, see: [https://github.com/octokit/octokit.net/issues/638] (https://github.com/octokit/octokit.net/issues/638)

If necessary, you can modify the `CREATE_ISSUE_INTERVAL` release rate for the` node_modules/hexo-generator-issues/dist/generator` file.

### More problem
If there are other questions or feedback, please come to [tcatche/hexo-generator-issues](https://github.com/tcatche/hexo-generator-issues/issues).

## Update
Rewrites a new version, optimizes the publishing logic, caches the history, and ensures that the next release is faster.

**The current version is the beta version, which is not stable and should not be used in important repo.**

## License
[MIT](./LICENSE)