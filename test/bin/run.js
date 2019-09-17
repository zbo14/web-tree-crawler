'use strict'

const assert = require('assert')
const fs = require('fs')
const path = require('path')
const rewire = require('rewire')
const sinon = require('sinon')
const { promisify } = require('util')

const readFile = promisify(fs.readFile)
const unlink = promisify(fs.unlink)

describe('bin/run', () => {
  beforeEach(() => {
    this.run = rewire('../../bin/run')
  })

  it('resolves usage information', async () => {
    const result = await this.run()

    assert.strictEqual(result, [
      'Usage: [OPTIONS=] web-tree-crawler URL\n',
      'Options:',
      '  BATCH_SIZE   The number of requests to send at a time (default=200)',
      '  COOKIES      Cookies to send with each request',
      '  HEADERS      Headers to send with each request',
      '  OUTFILE      Write the tree to file instead of stdout',
      '  TIME_LIMIT   The max number of seconds to run (default=120)'
    ].join('\n'))
  })

  it('rejects if URL invalid', async () => {
    try {
      await this.run('foo.com')
      assert.fail('Should reject')
    } catch ({ message }) {
      assert.strictEqual(message, 'Invalid URL: foo.com')
    }
  })

  it('resolves tree', async () => {
    const crawl = sinon.stub().resolves('tree')

    this.run.__set__('crawl', crawl)

    const tree = await this.run('https://foo.com')

    assert.strictEqual(tree, 'tree')
  })

  it('processes headers', async () => {
    const crawl = sinon.stub().resolves('tree')

    this.run.__set__('crawl', crawl)

    const tree = await this.run('https://foo.com', { headers: 'x-foo: bar, x-baz: zab' })

    assert.strictEqual(tree, 'tree')

    sinon.assert.calledWithExactly(crawl, 'https://foo.com', {
      batchSize: undefined,
      headers: { 'x-foo': 'bar', 'x-baz': 'zab' },
      startPaths: [
        'crossdomain.xml',
        'robots.txt',
        'sitemap.xml'
      ],
      stringify: true,
      timeLimit: undefined
    })
  })

  it('doesn\'t process incomplete header', async () => {
    const crawl = sinon.stub().resolves('tree')

    this.run.__set__('crawl', crawl)

    const tree = await this.run('https://foo.com', { headers: 'x-foo:' })

    assert.strictEqual(tree, 'tree')

    sinon.assert.calledWithExactly(crawl, 'https://foo.com', {
      batchSize: undefined,
      headers: {},
      startPaths: [
        'crossdomain.xml',
        'robots.txt',
        'sitemap.xml'
      ],
      stringify: true,
      timeLimit: undefined
    })
  })

  it('process cookies', async () => {
    const crawl = sinon.stub().resolves('tree')

    this.run.__set__('crawl', crawl)

    const tree = await this.run('https://foo.com', { cookies: 'chocolate=chip; oatmeal=raisin' })

    assert.strictEqual(tree, 'tree')

    sinon.assert.calledWithExactly(crawl, 'https://foo.com', {
      batchSize: undefined,
      headers: { cookie: ['chocolate=chip', 'oatmeal=raisin'] },
      startPaths: [
        'crossdomain.xml',
        'robots.txt',
        'sitemap.xml'
      ],
      stringify: true,
      timeLimit: undefined
    })
  })

  it('process cookies and headers', async () => {
    const crawl = sinon.stub().resolves('tree')

    this.run.__set__('crawl', crawl)

    const tree = await this.run('https://foo.com', {
      cookies: 'chocolate=chip',
      headers: 'Cookie: oatmeal=raisin'
    })

    assert.strictEqual(tree, 'tree')

    sinon.assert.calledWithExactly(crawl, 'https://foo.com', {
      batchSize: undefined,
      headers: { cookie: ['chocolate=chip'] },
      startPaths: [
        'crossdomain.xml',
        'robots.txt',
        'sitemap.xml'
      ],
      stringify: true,
      timeLimit: undefined
    })
  })

  it('writes tree to file and resolves success message', async () => {
    const crawl = sinon.stub().resolves('tree')

    this.run.__set__('crawl', crawl)

    const outfile = path.join(__dirname, 'out')
    const message = await this.run('https://foo.com', { outfile })
    const tree = await readFile(outfile, 'utf8')

    await unlink(outfile)

    assert.strictEqual(message, 'Wrote tree to file!')
    assert.strictEqual(tree, 'tree')
  })
})
