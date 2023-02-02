const fs = require('fs')
const path = require('path')

module.exports = function(dbpath) {
  dbpath = path.resolve(dbpath)
  
  if(fs.existsSync(dbpath) === false) fs.writeFileSync(dbpath, '{}')
  
  return {
    set: function(i, v) {
      let current = JSON.parse(fs.readFileSync(dbpath))

      current[i] = v

      fs.writeFileSync(dbpath, JSON.stringify(current, null, 3))

      return JSON.parse(fs.readFileSync(dbpath))
    },
    get: function(i) {
      let current = JSON.parse(fs.readFileSync(dbpath))

      return current[i] || undefined
    },
    getJson: function() {
      let current = JSON.parse(fs.readFileSync(dbpath))

      return current
    },
    delete: function(i) {
      let current = JSON.parse(fs.readFileSync(dbpath))
      let remp = { i: "d" }

      delete current[i] || remp.i

      fs.writeFileSync(dbpath, JSON.stringify(current, null, 3))

      return JSON.parse(fs.readFileSync(dbpath))
    },
    reset: function() {
      fs.writeFileSync(dbpath, '{}')
    }
  }
}