'use strict'

const assert = require('assert')
const rewire = require('rewire')
const sinon = require('sinon')
const Tree = require('web-tree')

describe('lib/index', () => {
  beforeEach(() => {
    this.clock = sinon.useFakeTimers()
    this.crawl = rewire('../../lib')
  })

  afterEach(() => this.clock.restore())

  it('rejects if URL invalid', async () => {
    try {
      await this.crawl('foo.com')
      assert.fail('Should reject')
    } catch ({ message }) {
      assert.strictEqual(message, 'Invalid URL: foo.com')
    }
  })

  it('mocks crawling and URL parsing', async () => {
    const request = sinon.spy((url, opts) => {
      return new Promise((resolve, reject) => {
        let body = ''
        const headers = {}

        switch (url) {
          case 'https://foo.com':
            headers['x-baz'] = 'http://bar.foo.com'
            body = 'http://someotherdomain.org'
            break

          case 'http://bar.foo.com':
            body = [
              'https://bam.bar.foo.com',
              'https://baz.foo.com',
              'https://foo.com',
              'href="/a/b/c"'
            ].join(' ')
            break

          case 'http://bar.foo.com/a/b/c':
            break

          default:
            return reject(new Error('whoops'))
        }

        resolve({ body, headers })
      })
    })

    this.crawl.__set__('request', request)

    const result = await this.crawl('https://foo.com', {})

    assert(result instanceof Tree)

    assert.deepStrictEqual(result.toObject(), {
      com: {
        subdomains: {
          foo: {
            subdomains: {
              bar: {
                subdomains: {
                  bam: {}
                },

                path: {
                  subpaths: {
                    a: {
                      subpaths: {
                        b: {
                          subpaths: {
                            c: {}
                          }
                        }
                      }
                    }
                  }
                }
              },

              baz: {}
            }
          }
        }
      }
    })

    sinon.assert.callCount(request, 5)

    sinon.assert.calledWithExactly(request.getCall(0), 'https://foo.com', {})
    sinon.assert.calledWithExactly(request.getCall(1), 'http://bar.foo.com', {})
    sinon.assert.calledWithExactly(request.getCall(2), 'http://bar.foo.com/a/b/c', {})
    sinon.assert.calledWithExactly(request.getCall(3), 'https://bam.bar.foo.com', {})
    sinon.assert.calledWithExactly(request.getCall(4), 'https://baz.foo.com', {})
  })

  it('mocks crawling and URL parsing with timeout, resolves stringified result', async () => {
    const request = sinon.spy((url, opts) => {
      return new Promise((resolve, reject) => {
        let body = ''
        const headers = {}

        switch (url) {
          case 'https://foo.com/mypath':
            body = 'http://bar.foo.com http://someotherdomain.org'
            break

          case 'http://bar.foo.com':
            body = [
              'https://bam.bar.foo.com',
              'https://baz.foo.com',
              'https://foo.com'
            ].join(' ')
            break

          case 'https://baz.foo.com':
            this.clock.tick(120e3)
        }

        resolve({ body, headers })
      })
    })

    this.crawl.__set__('request', request)

    const opts = { startPaths: ['mypath', '/mypath'], stringify: true }
    const result = await this.crawl('https://foo.com', opts)

    assert.strictEqual(result, [
      '.com',
      '  .foo',
      '    /mypath',
      '    .bar',
      '      .bam',
      '    .baz'
    ].join('\n'))

    sinon.assert.callCount(request, 5)

    sinon.assert.calledWithExactly(request.getCall(0), 'https://foo.com', opts)
    sinon.assert.calledWithExactly(request.getCall(1), 'https://foo.com/mypath', opts)
    sinon.assert.calledWithExactly(request.getCall(2), 'http://bar.foo.com', opts)
    sinon.assert.calledWithExactly(request.getCall(3), 'https://bam.bar.foo.com', opts)
    sinon.assert.calledWithExactly(request.getCall(4), 'https://baz.foo.com', opts)
  })
})
