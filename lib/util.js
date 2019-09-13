'use strict'

const path = require('path')
const { URL } = require('url')

const linkRegex = /(?:action|formaction|href|icon|src)="(.*?)"/g
const urlRegex = /https?:\/\/[A-Za-z0-9-._~:/?#[\]@!$&'()*+,;=%]{1,2048}/g

const matchAll = (body, regex) => {
  const matches = []

  let match

  while ((match = regex.exec(body))) {
    matches.push(match)
  }

  return matches
}

/** @module util */

/**
 * Add a relative URL to an absolute one.
 *
 * @param  {URL}    abs
 * @param  {String} rel
 *
 * @return {String}
 */
const addRelativeURL = (abs, rel) => {
  return rmTrailing(abs.protocol + '//' + path.join(abs.host, rel))
}

/**
 * Find unique URLs under a hostname in response body and headers.
 *
 * @param  {Object} opts
 * @param  {String} opts.body
 * @param  {Object} opts.headers
 * @param  {String} opts.hostname
 * @param  {String} opts.url
 *
 * @return {String[]}
 */
const findURLs = ({ body, headers, hostname, url }) => {
  url = new URL(url)

  headers = Object.entries(headers)
    .map(([, value]) => value)
    .join('\n')

  const linkMatches = matchAll(body, linkRegex)
  const urlMatches = matchAll(headers + '\n' + body, urlRegex)
  const urls = new Set()

  linkMatches.forEach(([, link]) => {
    try {
      const url = new URL(link)

      if (url.hostname.endsWith(hostname)) {
        urls.add(rmTrailing(url.href))
      }
    } catch (_) {
      urls.add(addRelativeURL(url, link))
    }
  })

  urlMatches.forEach(([url]) => {
    try {
      url = new URL(url)

      if (url.hostname.endsWith(hostname)) {
        urls.add(rmTrailing(url.href))
      }
    } catch (_) {}
  })

  return [...urls]
}

/**
 * Takes an options object and returns valid, specified options with defaults
 * for any unspecified/invalid options.
 *
 * @param  {Object}   opts
 * @param  {Number}   opts.batchSize
 * @param  {String[]} opts.startPaths
 * @param  {Number}   opts.timeLimit
 *
 * @return {Object}
 */
const getOpts = ({ batchSize, startPaths, timeLimit }) => {
  batchSize = isPositiveInteger(batchSize) ? batchSize : 200
  timeLimit = isPositiveInteger(timeLimit) ? timeLimit : 120

  const valid = Array.isArray(startPaths) &&
    startPaths.every(path => typeof path === 'string')

  if (!valid) {
    startPaths = []
  }

  return { batchSize, startPaths, timeLimit }
}

/**
 * Returns boolean indicating whether parameter is a positive integer.
 *
 * @param  {*} x
 *
 * @return {Boolean}
 */
const isPositiveInteger = x => Number.isInteger(x) && x > 0

/**
 * Remove trailing stuff from a URL/path.
 *
 * @param  {String} path
 *
 * @return {String}
 */
const rmTrailing = url => url.replace(/[),;'/\s]*$/, '')

module.exports = {
  addRelativeURL,
  findURLs,
  getOpts,
  isPositiveInteger,
  rmTrailing
}
