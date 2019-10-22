'use strict'

const assert = require('assert')
const util = require('../../lib/util')

describe('lib/util', () => {
  describe('#findURLs()', () => {
    it('finds URLs with hostname', () => {
      const body = [
        'https://bar.foo.com',
        'http://baz.foo.com',
        'foo.com',
        'href="https://baz.foo.com/qux"',
        'src="/a/b/c"',
        'icon="https://somewhereelse.org"',
        'https://baz.foo.com/qux);',
        'https://different_hostname.org'
      ].join('\n')

      const headers = {
        'x-foo': 'https://baz.bar.foo.com',
        'x-bar': 'notaurl'
      }

      const urls = util.findURLs({
        body,
        headers,
        hostname: 'foo.com',
        url: 'https://baz.foo.com'
      })

      urls.sort((a, b) => a > b ? 1 : -1)

      assert.deepStrictEqual(urls, [
        'http://baz.foo.com',
        'https://bar.foo.com',
        'https://baz.bar.foo.com',
        'https://baz.foo.com/a/b/c',
        'https://baz.foo.com/qux'
      ])
    })
  })

  describe('#getOpts()', () => {
    it('gets specified opts', () => {
      const result = util.getOpts({ numRequests: 1e3, startPaths: ['foo', 'bar'], timeLimit: 240, verbose: true })

      assert.deepStrictEqual(result, {
        numRequests: 1e3,
        startPaths: ['foo', 'bar'],
        timeLimit: 240,
        verbose: true
      })
    })

    it('gets default opts', () => {
      const result = util.getOpts({})

      assert.deepStrictEqual(result, {
        numRequests: 200,
        startPaths: [],
        timeLimit: 120,
        verbose: false
      })
    })
  })

  describe('#isPositiveInteger()', () => {
    it('returns true if positive integer', () => {
      const result = util.isPositiveInteger(1)
      assert.strictEqual(result, true)
    })

    it('returns false if not integer', () => {
      const result = util.isPositiveInteger(1.1)
      assert.strictEqual(result, false)
    })

    it('returns false if not positive', () => {
      const result = util.isPositiveInteger(-1)
      assert.strictEqual(result, false)
    })
  })
})
