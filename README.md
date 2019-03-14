# `tidyjs`

```js
import { ServerApp } from 'tidyjs'

const app = new ServerApp()

app.onGet('/', input => {
    return {
       message: `Hello ${input.query.my_name || 'world'}, I am tidyjs`,
    }
})

app.listen(3000)
```

## Introduction
tidyjs is tidy Node.js framework for building server-side applications on top of TypeScript & JavaScript.

tidyjs uses modern JavaScript, is built with TypeScript (preserves compatibility with pure JavaScript).

Under the hood, tidyjs makes use of [Express](https://github.com/expressjs/express), but hide it's details

## EcoSystem
| Project | Status | Description |
|---------|--------|-------------|
| [tidyjs] | ![tidyjs-version] | core project|
| [tidy-cookie] | ![tidy-cookie-version] | core project|
| [tidy-upload] | ![tidy-upload-version] | core project|

## Installation
```
npm i tidyjs --save
```
Or
```
yarn add tidyjs
```







[tidyjs]: https://github.com/guopi/tidy/tree/master/packages/tidyjs
[tidyjs-version]: https://img.shields.io/npm/v/tidyjs.svg

[tidy-cookie]: https://github.com/guopi/tidy/tree/master/packages/tidy-cookie
[tidy-cookie-version]: https://img.shields.io/npm/v/tidy-cookie.svg

[tidy-upload]: https://github.com/guopi/tidy/tree/master/packages/tidy-upload
[tidy-upload-version]: https://img.shields.io/npm/v/tidy-upload.svg
