#!/usr/bin/env node
'use strict'

let consts = require('./consts')
let path = require('path')
let fs = require('fs')
let util = require('./util')

function cliMain(args) {
    switch (args[0]) {
        case 'init-lib':
            initLibrary()
            break
        default:
            console.error(`Usage:
    yarn tidy-dev-cli init-lib             
`)
    }
}

function initLibrary() {
    initPackageJson()
    initTidyDevJson()
    initTSConfigJson()
    initRollupConfigJs()
}

const PACKAGE_JSON_FILE = './package.json';

function addDefaults(target, name, defaultValue) {
    if (target[name] === undefined)
        target[name] = defaultValue
}

const _TidyDevToolsModulePath = './node_modules/tidy-dev-tools'

function initPackageJson() {
    let pkg = util.readJsonFileSync(PACKAGE_JSON_FILE) || {}
    let devToolsPkg = util.readJsonFileSync(_TidyDevToolsModulePath + "/package.json") || {}

    addDefaults(pkg, "version", "0.0.1")
    const defaultPackageName = path.basename(path.resolve('./'));
    addDefaults(pkg, "name", defaultPackageName)
    addDefaults(pkg, "author", "guopi <guopi.pro@gmail.com>")
    addDefaults(pkg, "license", "MIT")
    addDefaults(pkg, "description", defaultPackageName)

    pkg.main = "./lib/index.cjs.js"
    pkg.module = "./lib/index.esm.js"
    pkg.types = "./lib/index.d.ts"

    addDefaults(pkg, "homepage", "https://github.com/")
    addDefaults(pkg, "files", ["lib"])
    addDefaults(pkg, "repository", {
        "type": "git",
        "url": "git+https://github.com/xxx/yyy.git"
    })
    addDefaults(pkg, "scripts", {})
    addDefaults(pkg.scripts, "build", "rollup -c")
    addDefaults(pkg.scripts, "prepublishOnly", "rollup -c")

    addDefaults(pkg, "devDependencies", {})
    addDefaults(pkg.devDependencies, "tidy-dev-tools", '^' + (devToolsPkg.version || '1.0.0'))

    util.writeJsonFileSync(PACKAGE_JSON_FILE, pkg)
}

function initTidyDevJson() {
    if (!fs.existsSync(consts.TidyDevConfPath)) {
        console.info(`generate ${consts.TidyDevConfPath}.`)
        fs.copyFileSync(_TidyDevToolsModulePath + '/data/' + consts.TidyDevConfFileName, consts.TidyDevConfPath)
    }
}

function initTSConfigJson() {
    let tsconfigPath = './tsconfig.json'
    let baseTsConfigFileName = 'tidy-tsconfig.base.json'

    if (!fs.existsSync(tsconfigPath)) {
        console.info(`generate ${tsconfigPath}.`)
        fs.copyFileSync(_TidyDevToolsModulePath + '/data/' + baseTsConfigFileName, './' + baseTsConfigFileName)
        fs.copyFileSync(_TidyDevToolsModulePath + '/data/tidy-tsconfig.default.json', tsconfigPath)
    }
}

function initRollupConfigJs() {
    let RollupConfigJsFile = 'rollup.config.js'

    if (!fs.existsSync('./' + RollupConfigJsFile)) {
        console.info(`generate ${RollupConfigJsFile}.`)
        fs.copyFileSync(_TidyDevToolsModulePath + '/data/' + RollupConfigJsFile, './' + RollupConfigJsFile)
    }
}


cliMain(process.argv.slice(2))
