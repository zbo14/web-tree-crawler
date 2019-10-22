'use strict'

const fs = require('fs').promises
const crawl = require('../lib')

const usage = [
  'Usage: [option=] web-tree-crawler <url>\n',
  'Options:',
  '  cookies    , c  Cookies to send with each request',
  '  headers    , h  Headers to send with each request',
  '  numRequests, n  The number of requests to send at a time (default=200)',
  '  outFile    , o  Write the tree to file instead of stdout',
  '  pathList   , p  File containing paths to initially crawl',
  '  timeLimit  , t  The max number of seconds to run (default=120)',
  '  verbose    , v  Log info and progress to stdout'
].join('\n')

module.exports = async (url, {
  cookies,
  headers,
  numRequests,
  outFile,
  pathList,
  timeLimit,
  verbose
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

  let startPaths = ['robots.txt', 'sitemap.xml']

  if (pathList) {
    try {
      const data = await fs.readFile(pathList, 'utf8')
      startPaths = data.split('\n').filter(Boolean)
    } catch (_) {
      throw new Error('File not found: ' + pathList)
    }
  }

  const result = await crawl(url, {
    headers,
    numRequests,
    startPaths,
    stringify: true,
    timeLimit,
    verbose
  })

  if (!outFile) return result

  await fs.writeFile(outFile, result)

  return 'Wrote tree to file!'
}
