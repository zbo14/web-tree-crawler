'use strict'

const http = require('http')
const https = require('https')
const { URL } = require('url')
const util = require('./util')

/** @module request */

const userAgent = 'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:47.0) Gecko/20100101 Firefox/47.0'

/**
 * Send a GET request to the specified URL with options. Includes some headers
 * by default (e.g. User-Agent), follows redirects, and rejects on 4XX/after
 * 3s timeout.
 *
 * @param  {(String|URL)} url
 * @param  {Object}       [opts = {}] - options for #http.get() or #https.get()
 *
 * @return {Promise}
 */
const request = (url, opts = {}) => {
  return new Promise((resolve, reject) => {
    try {
      url = new URL(url)
    } catch (err) {
      return reject(err)
    }

    setTimeout(() => reject(new Error('Request timeout')), 3e3)

    const { get } = url.protocol === 'https:' ? https : http
    const headers = opts.headers = opts.headers || {}
    headers['user-agent'] = headers['user-agent'] || userAgent

    get(url, opts, resp => {
      const code = resp.statusCode / 100 | 0

      if (code === 4) {
        return reject(new Error('Status code: ' + resp.statusCode))
      }

      if (code === 3) {
        const { location } = resp.headers

        if (!location) return reject(new Error('Failed redirect'))

        let redirectURL

        try {
          redirectURL = new URL(location)
        } catch (_) {
          redirectURL = new URL(util.addRelativeURL(url, location))
        }

        return request(redirectURL, opts)
          .then(resolve)
          .catch(reject)
      }

      let body = ''

      resp
        .once('end', () => resolve({ headers: resp.headers, body }))
        .once('error', reject)
        .on('data', chunk => {
          body += chunk
        })
    }).once('error', reject)
  })
}

module.exports = request
