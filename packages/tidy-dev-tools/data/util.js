let fs = require('fs')

function readTextFileSync(path) {
    return fs.readFileSync(path, "utf-8")
}

function readJsonFileSync(path) {
    if (fs.existsSync(path)) {
        const json = (readTextFileSync(path) || '').trim()
        if (json)
            return JSON.parse(json)
    }
    return undefined
}

function writeJsonFileSync(path, json) {
    fs.writeFileSync(path, JSON.stringify(json, null, 4))
}


exports.readTextFileSync = readTextFileSync
exports.readJsonFileSync = readJsonFileSync
exports.writeJsonFileSync = writeJsonFileSync
