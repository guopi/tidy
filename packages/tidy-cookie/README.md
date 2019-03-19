# `tidy-cookie`

> tidy processor to parse cookies

## Usage

```typescript
import { cookieParser } from 'tidy-cookie'
import { TidyServerApp } from 'tidyjs'
new TidyServerApp()
    .use(cookieParser())
    .listen(3000)
```

