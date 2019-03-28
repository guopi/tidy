# `tidy-cookie`
> tidy plugin to parse cookies

## Installation
```bash
$ npm install tidy-cookie --save
```

## Usage

```typescript
import { TidyServerApp } from 'tidyjs'
import { tidyCookieParser } from 'tidy-cookie'
new TidyServerApp()
    .use(tidyCookieParser())
    .use(ctx => {
        // ctx.req.cookies is a object like { cookie1:value1,...}
        return {
            request_cookies: ctx.req.cookies
        }
    })
    .listen(3000)
```


