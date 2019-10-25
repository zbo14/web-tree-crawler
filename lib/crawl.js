'use strict'

const EventEmitter = require('events')
const Tree = require('web-tree')
const request = require('./request')
const util = require('./util')

/** @module crawl */

/**
 * This is the main exported function that crawls and resolves the URL tree.
 *
 * @param  {String}   url
 * @param  {Object}   [opts = {}]
 * @param  {Object}   [opts.headers]           - headers to send with each request
 * @param  {Number}   [opts.numRequests = 200] - the number of requests to send at a time
 * @param  {String[]} [opts.startPaths]        - paths to initially crawl
 * @param  {Boolean}  [opts.stringify]         - stringify the tree
 * @param  {Number}   [opts.timeLimit = 120]   - the max number of seconds to run for
 * @param  {Boolean}  [opts.verbose]           - if true, logs info and progress to stdout
 * @param  {}         [opts....]               - additional options for #lib.request()
 *
 * @return {Promise}
 */
const crawl = async (url, opts = {}) => {
  const emitter = new EventEmitter()
  emitter.setMaxListeners(Infinity)

  const { hostname, href, origin } = new URL(url)
  const { numRequests, startPaths, timeLimit, verbose } = util.getOpts(opts)
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

  let done, waiting = 0

  const finish = () => {
    done = true
    emitter.emit('continue')
  }

  const timeout = setTimeout(() => {
    finish()
    verbose && console.log('Reached time limit, finishing up...')
  }, timeLimit * 1e3)

  const promises = Array.from({ length: numRequests })
    .map(async (_, i) => {
      let url = toVisit.shift()

      while (!done) {
        while (!url) {
          if (++waiting === numRequests) {
            verbose && console.log('Ran out of URLs :/')
            return finish()
          }

          await EventEmitter.once(emitter, 'continue')
          if (done) return
          --waiting
          url = toVisit.shift()
        }

        try {
          const { body, headers } = await request(url, opts)
          verbose && console.log(`Visited "${url}"`)
          const urls = util.findURLs({ body, headers, hostname, url })
          tree.set(url)
          const newUrls = urls.filter(url => !visited.has(url))
          newUrls.forEach(url => toVisit.push(url))
          newUrls.length && emitter.emit('continue')
        } catch (err) {
          verbose && console.error(err.message)
        }

        visited.add(url)
        url = toVisit.shift()
      }
    })

  await Promise.all(promises)

  clearTimeout(timeout)

  verbose && console.log(`Visited ${visited.size} URLs!`)

  return opts.stringify ? tree.toString() : tree
}

module.exports = crawl
