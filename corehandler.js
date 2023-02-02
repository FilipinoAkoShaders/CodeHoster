const fs = require('fs')
const path = require('path')
const db = require('./db.js')('cores.json')

module.exports = function() {
  let cores = path.join(__dirname, 'cores')

  fs.readdirSync(cores).forEach(core => {
    let corepath = path.join(cores, core)
    let json = require(corepath)

    json.aliases.forEach(alias => {
      db.set(alias, json)
    })

    db.set(json.core, json)
  })
}