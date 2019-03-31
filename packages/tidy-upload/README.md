# `tidy-upload`

> tidy plugin to support file upload

## Installation
```bash
$ npm install tidy-upload --save
```

## Usage

```typescript
import { tidyServerApp } from 'tidyjs'
import { tidyUploadPlugin } from 'tidy-upload'

tidyServerApp()
    .use(tidyUploadPlugin())
    .use(ctx => {
        return { message: `file1 uploaded to ${ctx.req.files.file1.path}` }
    })
    .listen(3000)
```

