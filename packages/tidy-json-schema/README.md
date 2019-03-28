# `tidy-json-schema`

> define and validate json schema

## Installation
```bash
$ npm install tidy-json-schema --save
```

## Usage

```typescript
// for typescript

import { isErrors, tjs } from 'tidy-json-schema'

let schema = tjs.obj({
    age: tjs.int().opt(),
    name: tjs.obj({
        first: tjs.str(),
        mid: tjs.str().opt(),
        last: tjs.str(),
    }),
    friends: tjs.arr(tjs.str())
})

let result = schema.validate({})
if (isErrors(result)) {
    // result if ValidateError[]
    console.log('validate errors:', result)
} else if (result !== undefined) {
    console.log('convert to new value:', result.newValue)
} else {
    console.log('validate success')
}
```

