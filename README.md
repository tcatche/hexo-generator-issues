# hexo-generator-issues

The Hexo plugin publish your posts to GitHub issues.  

The plugin work on generate stage.When run `hexo g` or `hexo generate`, the issue will be published.  

The posts and issue are associated with `post.title` to `issue.title`. If the post has not be published -- there is no issue has a same title with a post -- then will cerate a new issue using `post.title`, `post.tag` and `post._content`(post's markdown source content).If change the post content, the first issue has the same title will update. Otherwise, if a post be delete or reset title, the issue will be closed.  

And you can use metadata `issueNumber` to point a post to a issue.

## Install

```
npm install hexo-generator-issues --save
```

## Options
You should add this configuration in `_config.yml`.

```yml
issues:
  auth:
    # Auth type,More in https://github.com/mikedeboer/node-github#authentication
    type: 
    # Auth from token
    token: 
    # Auth from client keys
    id:
    secret: 
    # Auth from credentials
    username:
    password:
  repository:  # The issue repository. 
    owner:  # `userName`
    repo: # `repositoryName` 
  sourceLink: 
    position: 'top' # `top` or `bottom` or `false` 
    template: 'The original: $$url.**`. `$$url' # The default template is 'The original: $$url.**`. `$$url'
  issueLink: # add issue link on the top or bottom of content.
    position: 'bottom' # `top` or `bottom` or other as `false`
    template: '**Have any question? go to github issue to discuss: $$url.**' # `$$url` is the link placeholder，is using markdown format `![post title](post url)`
```

- **auth** - Push issue need be authenticated. More auth info in [Node-github](https://github.com/mikedeboer/node-github#authentication). And the authentication alse need **have push access** to the repository. 
- **repository** - The repository puts issues.Need **have push access**. The `repositoryName` must exist in `userName` account.
  - **owner** - `userName`.
  - **repo** - `repositoryName` 
- **sourceLink** - This Option will add post link on the top or bottom of the issue. 
  - **position** - Link postition. Allow `top` or `bottom`. set other value will not add post link to issue.
  - **template** - Link style. Allow any markdown syntx, the default value is `**The original: $$url.**`. `$$url` is the link placeholder，will be replaced by markdown format `![post title](post url)`
- **issueLink**  - This Option will add issue link on the top or bottom of the issue.it only work when a post has a `issueNumber`.Note it will not check the issue is exist or not.
  - **position** - Link postition. Allow `top` or `bottom`.
  - **template** - Link style. Allow any markdown syntx, the default value is `**Have any question? go to github issue to discuss: $$url.**` is the link placeholder，will be replaced by markdown format `![post title](issue url)`

In order to better management issue create and update, the post allow to add a new metadata field `issueNumber`.

```
---
title: The post's title
...
issueNumber: 1
...
---
```

This field be specified to connecting post to existing issue.If the value of this field corresponds to the issue does not exist, this field will be ignored. If the value is set `0`, the post will not publish as a issue.

## Test
Before test, you should add option about authentication and test repository in `test/options.js` files.The authentication must has access in creating and delete repository.  

```js
var option = {
  auth: {
    // ..authInfo, details in https://github.com/mikedeboer/node-github#authentication
  }, 
  repository: {
    owner: 'owner', // userName
    repo: '__hexo-igenerator-issue-test'
  }
};
```

Then run `npm run test.`  

## Note

Create issues too fast you may see the error:

```
HTTP/1.1 403 Forbidden
Content-Type: application/json; charset=utf-8
Connection: close

{
  "message": "You have triggered an abuse detection mechanism and have been temporarily blocked from content creation. Please retry your request again later.",
  "documentation_url": "https://developer.github.com/v3#abuse-rate-limits"
}
```

This is because github limit some of api's rate: [dealing-with-abuse-rate-limits](https://developer.github.com/v3/guides/best-practices-for-integrators/#dealing-with-abuse-rate-limits)

> Requests that create content which triggers notifications, such as issues, comments and pull requests, may be further limited and will not include a Retry-After header in the response. Please create this content at a reasonable pace to avoid further limiting.

So, to aviding the error, the first time publish every posts have a 2s interval, thus it will take very long time. If failed, you can try it later. More details in [https://github.com/octokit/octokit.net/issues/638](https://github.com/octokit/octokit.net/issues/638)

## Update Logs
**2017-09-18**

Add issue link support.

Fix publish issue errors.

**2017-08-02**

Add mocha test case.

Change github lib.

Fix sometimes will duplicated publish problem.

**2017-08-01**

Add support to ignore post when set `issueNumber` value to `0`.

Add babel to transform the code.

**2017-07-31**

Add support to connecting post to existing issues with add post meta data `issueNumber`.

**2017-07-28**

Initialize the Repository.

## License
[MIT](./LICENSE)