// import json from 'rollup-plugin-json';
// import commonjs from "rollup-plugin-commonjs";
// import nodeResolve from "rollup-plugin-node-resolve";

import pkg from './package.json'
import typescript from 'rollup-plugin-typescript2';
import {dts} from "rollup-plugin-dts";
import {readFileSync} from "fs"

const typeDefines = readFileSync('./build-tools/dts-bundle-header.ts', 'utf8')

export default [
    {
        input: './src/index.ts',
        external: [
            ...Object.keys(pkg.dependencies || {}),
            'http',
        ],
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
        output: [{
            file: pkg.types,
            format: "es"
        }],
        plugins: [
            {
                name: 'add dts header',
                renderChunk(code) {
                    return typeDefines + code
                }
            },
            dts({
                banner: false
            })
        ]
    }
]