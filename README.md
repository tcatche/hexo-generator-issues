# hexo-generator-issues

[中文文档](/README-zh.md)

This plugin publishes articles to github specified repository, and each article as an issue.

## install

```
npm install hexo-generator-issues --save
```

## run

The plugin takes effect when executing `hexo generate` or `hexo g`. The plugin will compare local file and `posts.updated` and then generate `_issue_generator_data.json` file.

After executing `hexo deploy` or `hexo d`, the plugin will push `_issue_generator_data.json` content to github and then create a `_issue_generator_record.json` file in the blog directory. this file records the contents of the current release, please **do not delete this file**.
this will ensure the next publish only publish the smallest changes, or the next publish will re-publish all the articles. This will cost a lot of time to publish your articles.

## Configuration

Add the following content in your configuration file (`_config.yml`):

```yml
deploy
  - type: 'issues'
  # github certification, when submit the issue used it
    auth: '<github token>'
    # Provide a repository that needs to be placed issues
    repository:  # The issue repository.
      owner: '<userName>'
      repo: '<repositoryName>'
    # In the issue to increase the original address of the blog reference, the corresponding address is post.permalink
    sourceLink:
      # blog address information at the beginning (`top`, default) or end (` bottom`),
      # use other values ​​to ignore the configuration
      position: '<top|bottom>' # `top` or `bottom` or other as `false`
      # The original message format, the default is `The default template is 'The original: $$url.**`，
      # $$url`  is the placeholder for the url of the blog，corresponding to markdown： `[${post.title}](${post.permalink})`
      template: '**本文博客地址：$$url.**'
```

## Test

```js
npm run test:g // test issue generate
npm run test:d // test issue deploy
```

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

## Related hexo plugins
- [hexo-generator-issues](https://github.com/tcatche/hexo-generator-issues): publish your hexo posts to github issues. 将个人文章发布到 github 的指定仓库下，每篇文章作为一个 issue。
- [hexo-generator-readme-file](https://github.com/tcatche/hexo-generator-readme-file): generate a `README.md` file contains all of blog posts link. 为你的文章生成一个 `README.md` 文件，里面包含了所有的文章链接。
- [hexo-filter-link-post](https://github.com/tcatche/hexo-filter-link-post): Transfer relative post link in markdown file to post link. 将文件里的通过相对路径引用的 markdown 文件转为对应的文章的链接。

## License

[MIT](./LICENSE)