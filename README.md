# hexo-generator-issues

The Hexo plugin synchronize your posts to GitHub issues.

The posts and issue are associated with title. If there is no issue has a same title with a post,then will use the post to create issue.Otherwise, if post does not exist, the issue will be close.

## Install
npm install hexo-generator-issues --save

## Options
You should add configuration in `_config.yml`.

```yml
issues:
  auth:
    # Auth from an access token - https://github.com/settings/
    token: 
    # Auth from client keys
    id:
    secret: 
    # Auth from credentials
    username:
    password:
  repository:  # The issue repository.  # `userName/repositoryName`
  sourceLink: 
    position:  # `top` or `bottom` or `false` 
    template: '' #  The default template is 
```

- **auth** - The GitHub API calls require authentication. so you need the GitHub app token or user name & password or the API key for authentication. The authentication must **have push access** to the repository. 
- **repository** - The repository puts issues.
- **sourceLink** - This Option will add post link on the top or bottom of the issue. 
-   **position** - Link postition. Allow `top` or `bottom`. set other value will not add post link to issue.
-   **template** - Link style. Allow any markdown syntx, the default value is `**The original: $$url.**`. `$$url` is the link placeholder，will be replaced by markdown format `![post title](post url)`

In order to better management issue create and update, the post allow to add a new metadata field `issueNumber`.

```
---
title: The post's title
...
issueNumber: 1
...
---
```

This field be specified to connecting post to existing issues.If the value of this field corresponds to the issue does not exist, this field will be ignored. If the value is set `0`, the post will not publish as a issue.

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
**2017-08-01**

Add support to ignore post when set `issueNumber` value to `0`.
Add babel to transform the code.

**2017-07-31**

Add support to connecting post to existing issues with add post meta data `issueNumber`.

**2017-07-28**

Initialize the Repository.