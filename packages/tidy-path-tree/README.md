# `tidy-path-tree`

> Path tree that used Prefix Tree(Trie Tree)

## Installation
```bash
$ npm install tidy-path-tree --save
```

## Usage

```typescript
// for typescript

import { PathTree } from 'tidy-path-tree'

const tree = new PathTree<string>()
tree.add('/a/b/:name', 'data')


/**
 * will returns : {
 *          path: 'a/b/:name',
  *         params: {
  *             name: 'tidy'
  *         }
  *     }
 */
const found = tree.find('/a/b/tidy')    

```

## Path Grammar
```yaml
    Path:  Layer  ( Layer Delimiter )*  GlobStarEnd?
    
    Layer: Seg*
    Seg: Param  |  Text  |  ReGroup
    
    GlobStarEnd: Delimiter "**"
    
    ReGroup: "("  <RegularExpressBody>  ")"
    
    Text: TextChar+
    TextChar:
      - <Char not Delimiter && not in '\r\n:(/?\\'>
      - BackslashChar
    BackslashChar: "\"  <Char not in "\r\n">
    
    Param = ":"  <JSIdentifier>  "*"?  ( ReGroup "*"? )?
```

## Path examples:
- /
- /part1
- part1/part2
- /part1/part2/**
- /test/:name/:type
- /test/:country([a-z]+)/:name([a-z]+)?/:code?([0-9]+)

