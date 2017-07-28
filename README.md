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
  repository:  # The issue repository. 'userName/repositoryName'
```

- **auth** - The GitHub API calls require authentication. so you need the GitHub app token or user name & password or the API key for authentication. The authentication must have push access to the repository. 
- **repository** - The repository puts issues.

## Note

[dealing-with-abuse-rate-limits](https://developer.github.com/v3/guides/best-practices-for-integrators/#dealing-with-abuse-rate-limits)

> Requests that create content which triggers notifications, such as issues, comments and pull requests, may be further limited and will not include a Retry-After header in the response. Please create this content at a reasonable pace to avoid further limiting.

Create issues to fast you may see the error:

```
HTTP/1.1 403 Forbidden
Content-Type: application/json; charset=utf-8
Connection: close

{
  "message": "You have triggered an abuse detection mechanism and have been temporarily blocked from content creation. Please retry your request again later.",
  "documentation_url": "https://developer.github.com/v3#abuse-rate-limits"
}
```

So, to aviding the error, the first time publish every posts have a 2s interval, thus is will take very long time. If failed, you can try it later. 