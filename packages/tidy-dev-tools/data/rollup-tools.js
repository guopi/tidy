import typescript from 'rollup-plugin-typescript2';
import {dts} from "rollup-plugin-dts";
import {existsSync, readdirSync, readFileSync} from "fs"
import {readJsonFileSync} from "./util";

const tidyDevConfFile = './tidy-dev.json'
const typesDir = './types'
const tsconfigOverride = {
    compilerOptions: {
        module: "ESNext",
    }
}

export function createRollupConfig() {
    const tidyDevConf = readJsonFileSync(tidyDevConfFile) || {}

    const external_modules = tidyDevConf.rollup && tidyDevConf.rollup.external_modules || []
    if (!Array.isArray(external_modules))
        throw new Error(`rollup.external_modules in ${tidyDevConfFile} is NOT Array`)

    const pkg = readJsonFileSync('./package.json')

    const external = [
        ...Object.keys(pkg.dependencies || {}),
        ...external_modules,
    ]

    const dtsInTypes = existsSync(typesDir) ?
        readdirSync(typesDir).filter(name => name.endsWith(".d.ts"))
            .map(name => `// merge from ${typesDir}/${name}\n${readFileSync(`${typesDir}/${name}`, 'utf8').trim()}`)
            .join('\n\n') + '\n\n// generate by rollup-plugin-dts\n'
        : ''

    return [
        {
            input: './src/index.ts',
            external,
            plugins: [
                typescript({
                    tsconfigOverride: tsconfigOverride,
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
                    banner: false,
                    compilerOptions: tsconfigOverride.compilerOptions
                })
            ],
            output: [{
                file: pkg.types,
                format: "es"
            }]
        }
    ]
}


