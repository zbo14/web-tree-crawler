#!/usr/bin/env node

'use strict'

const crawler = require('./web-tree-crawler')

const url = process.argv[2]

const { env } = process
const format = (env.format || env.f || '').trim()
const headers = (env.headers || env.h || '').trim()
const numRequests = +(env.numRequests || env.n)
const outFile = (env.outFile || env.o || '').trim()
const pathList = (env.pathList || env.p || '').trim()
const timeLimit = +(env.timeLimit || env.t)
const verbose = (env.verbose || env.v || '').trim() === 'true'

crawler(url, {
  format,
  headers,
  numRequests,
  outFile,
  pathList,
  timeLimit,
  verbose
}).then(console.log)
  .catch(err => console.error(err.message) || 1)
  .then(process.exit)
