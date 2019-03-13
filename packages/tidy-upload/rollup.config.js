// import json from 'rollup-plugin-json';
// import commonjs from "rollup-plugin-commonjs";
// import nodeResolve from "rollup-plugin-node-resolve";

import pkg from './package.json'
import typescript from 'rollup-plugin-typescript2';
import {dts} from "rollup-plugin-dts";
import {readdirSync, readFileSync} from "fs"

const typesDir = './types'
const dtsInTypes = readdirSync(typesDir)
    .map(name => `// merge from ${typesDir}/${name}\n${readFileSync(`${typesDir}/${name}`, 'utf8').trim()}`)
    .join('\n\n') + '\n\n// generate by rollup-plugin-dts\n'

const external = Object.keys(pkg.dependencies || {})

export default [
    {
        input: './src/index.ts',
        external,
        plugins: [
            typescript({
                cacheRoot: "./out/.rts2_cache"
            })
        ],
        output: [
            {file: pkg.main, format: 'cjs'},
            {file: pkg.module, format: 'es'}
        ]
    },
    {
        input: './src/index.ts',
        external,
        plugins: [
            {
                name: 'merge .d.ts files',
                renderChunk(code) {
                    return dtsInTypes + code
                }
            },
            dts({
                banner: false
            })
        ],
        output: [{
            file: pkg.types,
            format: "es"
        }]
    }
]