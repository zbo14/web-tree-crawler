'use strict'

const assert = require('assert')
const fs = require('fs')
const http = require('http')
const https = require('https')
const path = require('path')
const sinon = require('sinon')
const request = require('../../lib/request')

const cert = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'cert.pem'))
const key = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'key.pem'))

const testSuite = protocol => {
  describe(protocol, () => {
    beforeEach(done => {
      const { createServer } = protocol === 'https' ? https : http
      this.server = createServer({ cert, key })
      this.server.listen(8080, '127.0.0.1', done)
    })

    afterEach(() => this.server.close())

    it('makes request and receives 200', async () => {
      this.server.once('request', (_, resp) => {
        resp.setHeader('x-foo', 'bar')
        resp.end('foobar')
      })

      const { body, headers } = await request(protocol + '://localhost:8080', { rejectUnauthorized: false })

      assert.strictEqual(headers['x-foo'], 'bar')
      assert.strictEqual(body, 'foobar')
    })

    it('makes request and follows absolute redirect', async () => {
      this.server.once('request', (_, resp) => {
        this.server.once('request', (_, resp) => {
          resp.setHeader('x-foo', 'bar')
          resp.end('foobar')
        })
        resp.writeHead(301, { Location: protocol + '://localhost:8080' })
        resp.end()
      })

      const { headers, body } = await request(protocol + '://localhost:8080', { rejectUnauthorized: false })

      assert.strictEqual(headers['x-foo'], 'bar')
      assert.strictEqual(body, 'foobar')
    })

    it('makes request and follows relative redirect', async () => {
      this.server.once('request', (_, resp) => {
        this.server.once('request', (req, resp) => {
          if (req.url !== '/foobar') return resp.end('')
          resp.setHeader('x-foo', 'bar')
          resp.end('foobaz')
        })

        resp.writeHead(301, { Location: '/foobar' })
        resp.end()
      })

      const { headers, body } = await request(protocol + '://localhost:8080', { rejectUnauthorized: false })

      assert.strictEqual(headers['x-foo'], 'bar')
      assert.strictEqual(body, 'foobaz')
    })

    it('rejects on invalid redirect', async () => {
      this.server.once('request', (_, resp) => {
        resp.writeHead(301)
        resp.end()
      })

      try {
        await request(protocol + '://localhost:8080', { rejectUnauthorized: false })
        assert.fail('Should reject')
      } catch ({ message }) {
        assert.strictEqual(message, 'Failed redirect')
      }
    })

    it('makes request and receives 404', async () => {
      this.server.once('request', (_, resp) => {
        resp.writeHead(404)
        resp.end()
      })

      try {
        await request(protocol + '://localhost:8080', { rejectUnauthorized: false })
        assert.fail('Should reject')
      } catch ({ message }) {
        assert.strictEqual(message, 'Status code: 404')
      }
    })

    it('mocks request that times out', async () => {
      const clock = sinon.useFakeTimers()
      const promise = request(protocol + '://localhost:8080', { rejectUnauthorized: false })

      clock.tick(3e3)
      clock.restore()

      try {
        await promise
        assert.fail('Should reject')
      } catch ({ message }) {
        assert.strictEqual(message, 'Request timeout')
      }
    })
  })
}

describe('lib/request', () => {
  it('rejects invalid URL', async () => {
    try {
      await request('foobar.com')
      assert.fail('Should reject')
    } catch ({ message }) {
      assert.strictEqual(message, 'Invalid URL: foobar.com')
    }
  })

  testSuite('http')
  testSuite('https')
})
