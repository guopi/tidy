# `tidy-cookie`
> tidy plugin to parse cookies

## Usage

```typescript
import { tidyCookieParser } from 'tidy-cookie'
import { TidyServerApp } from 'tidyjs'
new TidyServerApp()
    .use(tidyCookieParser())
    .listen(3000)
```

