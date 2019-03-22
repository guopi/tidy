import {} from ''

const typesDir = './types'
const dtsInTypes = readdirSync(typesDir)
    .map(name => `// merge from ${typesDir}/${name}\n${readFileSync(`${typesDir}/${name}`, 'utf8').trim()}`)
    .join('\n\n') + '\n\n// generate by rollup-plugin-dts\n'

const external = [
    ...Object.keys(pkg.dependencies || {}),
    ...externalAdd,
]

const tsconfigOverride = {
    compilerOptions: {
        module: "ESNext",
    }
}


export default [
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