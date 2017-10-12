# hexo-generator-issues

[English Document.]('./README.md)

本插件将个人文章发布到 github 的指定仓库下，每篇文章作为一个 issue。

## 安装

```
npm install hexo-generator-issues@beta --save
```

## 发布
插件在执行 `generate` 的过程生效，也就是说，当执行 `hexo g` 或 `hexo generate`，发布将会执行。

```js
hexo generate 
// or
hexo g
```

发布后，将会在博客目录下生成 `_issue_generator_record'` 文件，文件记录了当前发布的内容，请**不要删除**，这个会保证下次发布仅发布最小的更改内容，否则下次发布将会重新发布所有的文章，从而导致发布速度较慢。

## 配置
在配置文件中（`_config.yml`）添加以下内容：

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

原有的配置项 `issueLink` 暂时删除，稍后版本将会重新启用。

**注意**，之前提到的文章中的 ~~issueNumber~~ 元数据参数不再使生效，将不再起作用：

```
---
title: The post's title
...
issueNumber: 1 // 不再起作用
...
---
```

## 测试
// todo 待补充 

## 问题

### 发布很慢

> Requests that create content which triggers notifications, such as issues, comments and pull requests, may be further limited and will not include a Retry-After header in the response. Please create this content at a reasonable pace to avoid further limiting.

由于 github 提供的接口的限制了创建 issue 的速率（详见：[dealing-with-abuse-rate-limits](https://developer.github.com/v3/guides/best-practices-for-integrators/#dealing-with-abuse-rate-limits)），因此设置了创建 issue 的时间间隔设置为 2000 ms，这会导致创建类任务非常多的情况下发布任务执行非常缓慢，同时也有可能会出现如下的问题：

```
HTTP/1.1 403 Forbidden
Content-Type: application/json; charset=utf-8
Connection: close

{
  "message": "You have triggered an abuse detection mechanism and have been temporarily blocked from content creation. Please retry your request again later.",
  "documentation_url": "https://developer.github.com/v3#abuse-rate-limits"
}
```

这种情况下，可以稍后一段时间重新执行发布命令.

了解更多的信息查看：[https://github.com/octokit/octokit.net/issues/638](https://github.com/octokit/octokit.net/issues/638)

如果需要，可以修改 `node_modules/hexo-generator-issues/dist/generator` 文件的 `CREATE_ISSUE_INTERVAL` 发布速率。

### 超时
国内可能访问 github 较慢，可以修改 `node_modules/hexo-generator-issues/dist/generator` 文件的 `CONNECT_GITHUB_TIMEOUT` 超时时间为更大的数字，默认为 5s或者使用代理

### 更多问题
如果有其他问题或者反馈，请到 [tcatche/hexo-generator-issues](https://github.com/tcatche/hexo-generator-issues/issues) 提出。

## 更新
当前版本为重写的新版本，优化了发布逻辑，对历史记录进行了缓存，确保下次发布更加快速。

**当前版本为测试版本，并不稳定，定不要在重要仓库下使用。**

## 许可
[MIT](./LICENSE)