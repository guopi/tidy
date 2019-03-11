import typescript from 'rollup-plugin-typescript2';
import {dts} from "rollup-plugin-dts";
import pkg from './package.json'

export default [
    {
        input: './src/index.ts',
        plugins: [
            typescript({
                cacheRoot: "./out/.rts2_cache"
            })
        ],
        output: [
            {
                file: pkg.main,
                format: 'cjs'
            },
            {
                file: pkg.module,
                format: 'es'
            }
        ]
    },
    {
        input: './src/index.ts',
        output: [{
            file: pkg.types,
            format: "es"
        }],
        plugins: [dts()]
    }
]