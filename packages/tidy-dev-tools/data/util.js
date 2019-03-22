import fs from "fs"

export function readJsonFileSync(path) {
    if (fs.existsSync(path)) {
        const json = (fs.readFileSync(path) || '').trim()
        if (json)
            return JSON.parse(json)
    }
    return undefined
}

export function writeJsonFileSync(path, json) {
    fs.writeFileSync(path, JSON.stringify(json, null, 4))
}