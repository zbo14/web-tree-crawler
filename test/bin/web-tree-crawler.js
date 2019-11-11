'use strict'

const assert = require('assert')
const fs = require('fs').promises
const path = require('path')
const rewire = require('rewire')
const sinon = require('sinon')

describe('bin/web-tree-crawler', () => {
  beforeEach(() => {
    this.crawler = rewire('../../bin/web-tree-crawler')
  })

  it('resolves usage information', async () => {
    const result = await this.crawler()

    assert.strictEqual(result, [
      'Usage: [option=] web-tree-crawler <url>\n',
      'Options:',
      '  format     , f  The output format of the tree (default="string")',
      '  headers    , h  File containing headers to send with each request',
      '  numRequests, n  The number of requests to send at a time (default=200)',
      '  outFile    , o  Write the tree to file instead of stdout',
      '  pathList   , p  File containing paths to initially crawl',
      '  timeLimit  , t  The max number of seconds to run (default=120)',
      '  verbose    , v  Log info and progress to stdout'
    ].join('\n'))
  })

  it('rejects if URL invalid', async () => {
    try {
      await this.crawler('foo.com')
      assert.fail('Should reject')
    } catch ({ message }) {
      assert.strictEqual(message, 'Invalid URL: foo.com')
    }
  })

  it('rejects if format invalid', async () => {
    try {
      await this.crawler('https://foo.com', { format: 'fax' })
      assert.fail('Should reject')
    } catch ({ message }) {
      assert.strictEqual(message, 'Invalid format: fax')
    }
  })

  it('resolves string representation of tree', async () => {
    const crawl = sinon.stub().resolves({ toString: () => 'tree' })

    this.crawler.__set__('crawl', crawl)

    const tree = await this.crawler('https://foo.com')

    assert.strictEqual(tree, 'tree')
  })

  it('resolves HTML representation of tree', async () => {
    const crawl = sinon.stub().resolves({ toHTML: () => 'tree' })
    const www = path.join(__dirname, '..', '..', 'bin', 'www')

    this.crawler.__set__('crawl', crawl)

    const tree = await this.crawler('https://foo.com', { format: 'html' })

    assert.strictEqual(tree, [
      '<!DOCTYPE html>',
      '<html>',
      '<head>',
      '<title>https://foo.com</title>',
      `<link rel="stylesheet" href="${path.join(www, 'styles.css')}">`,
      '</head>',
      '<body>',
      'tree',
      `<script src="${path.join(www, 'index.js')}"></script>`,
      '</body>',
      '</html>'
    ].join('\n'))
  })

  it('processes headers', async () => {
    const crawl = sinon.stub().resolves({ toString: () => 'tree' })
    const headers = path.join(__dirname, '..', 'fixtures', 'headers')

    this.crawler.__set__('crawl', crawl)

    const tree = await this.crawler('https://foo.com', { headers })

    assert.strictEqual(tree, 'tree')

    sinon.assert.calledWithExactly(crawl, 'https://foo.com', {
      headers: { 'x-foo': 'bar', 'x-baz': 'zab' },
      numRequests: undefined,
      startPaths: ['robots.txt', 'sitemap.xml'],
      timeLimit: undefined,
      verbose: undefined
    })
  })

  it('doesn\'t process incomplete header', async () => {
    const crawl = sinon.stub().resolves({ toString: () => 'tree' })
    const headers = path.join(__dirname, '..', 'fixtures', 'bad-headers')

    this.crawler.__set__('crawl', crawl)

    const tree = await this.crawler('https://foo.com', { headers })

    assert.strictEqual(tree, 'tree')

    sinon.assert.calledWithExactly(crawl, 'https://foo.com', {
      headers: {},
      numRequests: undefined,
      startPaths: ['robots.txt', 'sitemap.xml'],
      timeLimit: undefined,
      verbose: undefined
    })
  })

  it('reads list of paths', async () => {
    const crawl = sinon.stub().resolves({ toString: () => 'tree' })
    const pathList = path.join(__dirname, '..', 'fixtures', 'path-list')

    this.crawler.__set__('crawl', crawl)

    const tree = await this.crawler('https://foo.com', { pathList })

    assert.strictEqual(tree, 'tree')

    sinon.assert.calledWithExactly(crawl, 'https://foo.com', {
      numRequests: undefined,
      headers: undefined,
      startPaths: ['foo', 'bar', 'baz'],
      timeLimit: undefined,
      verbose: undefined
    })
  })

  it('reads list of paths', async () => {
    const crawl = sinon.stub().resolves({ toString: () => 'tree' })
    const pathList = path.join(__dirname, '..', 'fixtures', 'not-here.txt')

    this.crawler.__set__('crawl', crawl)

    try {
      await this.crawler('https://foo.com', { pathList })
      assert.fail('Should reject')
    } catch ({ message }) {
      assert.strictEqual(message, 'File not found: ' + pathList)
    }
  })

  it('writes tree to file and resolves success message', async () => {
    const crawl = sinon.stub().resolves({ toString: () => 'tree' })

    this.crawler.__set__('crawl', crawl)

    const outFile = path.join(__dirname, 'out')
    const message = await this.crawler('https://foo.com', { outFile })
    const tree = await fs.readFile(outFile, 'utf8')

    await fs.unlink(outFile)

    assert.strictEqual(message, 'Wrote tree to file!')
    assert.strictEqual(tree, 'tree')
  })
})
