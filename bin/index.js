#!/usr/bin/env node

'use strict'

const crawler = require('./web-tree-crawler')

const url = process.argv[2]

const { env } = process
const batchSize = +(env.batchSize || env.b)
const cookies = env.cookies || env.c
const headers = env.headers || env.h
const outFile = env.outFile || env.o
const pathList = env.pathList || env.p
const timeLimit = +env.timeLimit || env.t
const verbose = (env.verbose || env.v || '').trim() === 'true'

crawler(url, {
  batchSize,
  cookies,
  headers,
  outFile,
  pathList,
  timeLimit,
  verbose
}).then(console.log)
  .catch(err => console.error(err.message) || 1)
  .then(process.exit)
