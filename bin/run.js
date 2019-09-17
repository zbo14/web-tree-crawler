'use strict'

const fs = require('fs')
const { promisify } = require('util')
const crawl = require('../lib')

const writeFile = promisify(fs.writeFile)

const usage = [
  'Usage: [OPTIONS=] web-tree-crawler URL\n',
  'Options:',
  '  BATCH_SIZE   The number of requests to send at a time (default=200)',
  '  COOKIES      Cookies to send with each request',
  '  HEADERS      Headers to send with each request',
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
  cookies,
  headers,
  outfile,
  timeLimit
} = {}) => {
  if (!url) return usage

  if (headers) {
    headers = headers
      .split(',')
      .reduce((headers, header) => {
        let [name, value] = header.split(':')
        name = name && name.trim().toLowerCase()
        value = value && value.trim()

        if (name && value) {
          headers[name] = value
        }

        return headers
      }, {})
  }

  if (cookies) {
    headers = headers || {}
    headers.cookie = cookies
      .split(';')
      .map(cookie => cookie.trim())
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
