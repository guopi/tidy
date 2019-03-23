# `tidy-router`

> tidy router used tidy-path-tree

## Usage

```typescript
// for typescript

import { TidyServerApp } from 'tidyjs'
import { TidyRouter } from 'tidy-router'

const app = new TidyServerApp()
const router = new TidyRouter()
router.on('GET','/a/b/:name', ctx => {
    return {
        text : 'hello router'
    }
})

app.use(router)

app.listen()
```

