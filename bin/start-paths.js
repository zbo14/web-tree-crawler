'use strict'

const fs = require('fs')
const path = require('path')

const pathList = path.join(__dirname, 'path-list')

module.exports = fs.readFileSync(pathList, 'utf8')
  .split('\n')
  .filter(Boolean)
  .map(line => line.trim())
