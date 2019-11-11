'use strict'

const fs = require('fs').promises
const path = require('path')
const crawl = require('../lib')

const usage = [
  'Usage: [option=] web-tree-crawler <url>\n',
  'Options:',
  '  format     , f  The output format of the tree (default="string")',
  '  headers    , h  File containing headers to send with each request',
  '  numRequests, n  The number of requests to send at a time (default=200)',
  '  outFile    , o  Write the tree to file instead of stdout',
  '  pathList   , p  File containing paths to initially crawl',
  '  timeLimit  , t  The max number of seconds to run (default=120)',
  '  verbose    , v  Log info and progress to stdout'
].join('\n')

module.exports = async (url, {
  format,
  headers,
  numRequests,
  outFile,
  pathList,
  timeLimit,
  verbose
} = {}) => {
  if (!url) return usage

  if (format && format !== 'html' && format !== 'string') {
    throw new Error('Invalid format: ' + format)
  }

  if (headers) {
    const filename = path.resolve(process.cwd(), headers)
    const data = await fs.readFile(filename, 'utf8')

    headers = {}

    data.split('\n').filter(Boolean).forEach(line => {
      let [name, ...rest] = line.split(':')
      name = name && name.trim().toLowerCase()
      const value = rest.join(':').trim()

      if (name && value) {
        headers[name] = value
      }
    })
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

  const tree = await crawl(url, {
    headers,
    numRequests,
    startPaths,
    timeLimit,
    verbose
  })

  const result = format === 'html' ? tree.toHTML() : tree.toString()

  if (!outFile) return result

  await fs.writeFile(outFile, result)

  return 'Wrote tree to file!'
}
