#!/usr/bin/env node --harmony
'use strict'

import path from 'path'
import tidyDevToolsPkg from '../package.json'

import {readJsonFileSync, writeJsonFileSync} from "./util";


function cliMain(args) {
    switch (args[0]) {
        case 'init-lib':
            initLibrary()
            break
        default:
            console.warn(`yarn tidy-dev-cli init-lib`)
    }
}


function initLibrary() {
    initPackageJson()
    initTSConfigJson()
    initRollupConfigJs()
}

const PACKAGE_JSON_FILE = './package.json';
const defaultPackageJsonScripts = {
    "build": "rollup -c",
    "prepublishOnly": "rollup -c"
}

function initPackageJson() {
    let pkg = readJsonFileSync(PACKAGE_JSON_FILE) || {}

    function addDefaults(name, defaultValue) {
        if (!pkg[name]) pkg[name] = defaultValue
    }

    //todo
    addDefaults("version", "0.0.1")
    const defaultPackageName = path.basename(path.resolve('./'));
    addDefaults("name", defaultPackageName)
    addDefaults("author", "guopi <guopi.pro@gmail.com>")
    addDefaults("license", "MIT")
    addDefaults("description", defaultPackageName)

    pkg.main = "./lib/index.cjs.js"
    pkg.module = "./lib/index.esm.js"
    pkg.types = "./lib/index.d.ts"

    addDefaults("homepage", "https://github.com/")
    addDefaults("files", ["lib"])
    addDefaults("repository", {
        "type": "git",
        "url": "git+https://github.com/xxx/yyy.git"
    })
    addDefaults("scripts", {})
    pkg.scripts = {...defaultPackageJsonScripts, ...pkg.scripts}
    addDefaults("devDependencies", {})
    pkg.devDependencies["tidy-dev-tools"] = tidyDevToolsPkg.version

    writeJsonFileSync(PACKAGE_JSON_FILE, pkg)
}

function initTSConfigJson() {
}

function initRollupConfigJs() {
}


cliMain(process.argv.slice(2))