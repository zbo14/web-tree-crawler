#!/usr/bin/env node

'use strict'

const run = require('./run')

const url = process.argv[2]
const batchSize = +process.env.BATCH_SIZE
const outfile = process.env.OUTFILE
const timeLimit = +process.env.TIME_LIMIT

run(url, { batchSize, outfile, timeLimit })
  .then(console.log)
  .catch(err => console.error(err.message) || 1)
  .then(process.exit)
