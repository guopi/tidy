# `tidy-util`

> tidy util library

## Installation
```bash
$ npm install tidy-util --save
```

## Usage

```javascript
import {asyncOf} from 'tidy-util'


function funcUseCallBack(param1, callback) {
    //...
    let err = undefined
    let data = 'some data'
    callback(err, data)
}


asyncOf(cb => funcUseCallBack('param1', cb))
    .then(data => console.log('funcUseCallBack return data', data))
    .catch(err => console.log('funcUseCallBack throws error', err))
    
```

