'use strict'

const Tree = require('web-tree')
const request = require('./request')
const util = require('./util')

/** @module crawl */

/**
 * This is the main exported function that crawls and resolves the URL tree.
 *
 * @param  {String}   url
 * @param  {Object}   [opts = {}]
 * @param  {Number}   [opts.batchSize = 200] - the number of requests to send at a time
 * @param  {Object}   [opts.headers]         - headers to send with each request
 * @param  {String[]} [opts.startPaths]      - paths to initially crawl
 * @param  {Boolean}  [opts.stringify]       - stringify the tree
 * @param  {Number}   [opts.timeLimit = 120] - the max number of seconds to run for
 * @param  {Boolean}  [opts.verbose]         - if true, logs info and progress to stdout
 * @param  {}         [opts....]             - additional options for #lib.request()
 *
 * @return {Promise}
 */
const crawl = async (url, opts = {}) => {
  const { hostname, href, origin } = new URL(url)
  const { batchSize, startPaths, timeLimit, verbose } = util.getOpts(opts)
  const tree = new Tree()

  let startURLs = startPaths.map(path => {
    if (path[0] !== '/') {
      path = '/' + path
    }

    return util.rmTrailing(origin + path)
  })

  startURLs = [...new Set(startURLs)]
  const visited = new Set()
  const toVisit = [href, ...startURLs].map(util.rmTrailing)

  verbose && console.log(`Crawling "${hostname}" for <= ${timeLimit} seconds\n`)

  let done

  const timeout = setTimeout(() => {
    done = true
    verbose && console.log('Reached time limit, wrapping up...')
  }, timeLimit * 1e3)

  while (!done && toVisit.length) {
    const slice = toVisit.splice(0, batchSize)

    verbose && console.log([
      'Visiting the following URLS:',
      ...slice.map(url => '  * ' + url)
    ].join('\n'))

    const promises = slice.map(async url => {
      try {
        const { body, headers } = await request(url, opts)
        const urls = util.findURLs({ body, headers, hostname, url })
        tree.set(url)
        urls.forEach(url => visited.has(url) || toVisit.push(url))
        verbose && console.log(`Successfully visited "${url}"`)
      } catch (err) {
        verbose && console.error(err.message)
      }

      visited.add(url)
    })

    await Promise.all(promises)
  }

  clearTimeout(timeout)

  return opts.stringify ? tree.toString() : tree
}

module.exports = crawl