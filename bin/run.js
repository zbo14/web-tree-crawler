'use strict'

const fs = require('fs')
const { promisify } = require('util')
const crawl = require('../lib')

const writeFile = promisify(fs.writeFile)

const usage = [
  'Usage: [OPTIONS=] web-tree-crawler URL\n',
  'Options:',
  '  BATCH_SIZE   The number of requests to send at a time (default=200)',
  '  HEADERS',
  '  OUTFILE      Write the tree to file instead of stdout',
  '  TIME_LIMIT   The max number of seconds to run (default=120)'
].join('\n')

const startPaths = [
  'crossdomain.xml',
  'robots.txt',
  'sitemap.xml'
]

module.exports = async (url, {
  batchSize,
  headers,
  outfile,
  timeLimit
} = {}) => {
  if (!url) return usage

  try {
    headers = headers && JSON.parse(headers)
  } catch (_) {
    throw new Error('Invalid headers')
  }

  const result = await crawl(url, {
    batchSize,
    headers,
    startPaths,
    stringify: true,
    timeLimit
  })

  if (!outfile) return result

  await writeFile(outfile, result)

  return 'Wrote tree to file!'
}
