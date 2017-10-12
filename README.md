# hexo-generator-issues

[中文文档]('./README-zh.md)

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
  # github 认证，提交 issue 的时候需要
  auth:
    # 认证类型，更多认证信息查看：https://github.com/mikedeboer/node-github#authentication
    type: 
    # 使用 token 认证需要提供 token
    token: 
    # 使用 client keys 认证需要提供 id 和 secret
    id:
    secret: 
    # 使用 credentials 需要提供 username 和 password
    username:
    password:

  # 提供需要放 issues 的仓库
  repository:
    owner:  # github 用户名
    repo: # 指定用户名下的仓库，仓库必须存在

  # 在 issue 中增加博客原文地址的引用，对应的地址是 post.permalink
  sourceLink: 
    position: 'top' # 博客地址信息放置在开头（`top`，默认）或者结束（`bottom`），使用其他值则忽略该项配置
    # 原文信息的格式，默认为 `The default template is 'The original: $$url.**`， 
    # 其中 `$$url` 是博客地址的 url 的占位符，对应于 markdown ： `[${post.title}](${post.permalink})`
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

### More
If there are other questions or feedback, please come to [tcatche/hexo-generator-issues](https://github.com/tcatche/hexo-generator-issues/issues).

## Update
Rewrites a new version, optimizes the publishing logic, caches the history, and ensures that the next release is faster.

**The current version is the beta version, which is not stable and should not be used in important repo.**

## License
[MIT](./LICENSE)