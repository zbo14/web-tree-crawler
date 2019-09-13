# web-tree-crawler

A naive web crawler that builds a tree of URLs using [web-tree](https://github.com/zbo14/web-tree).

**Note:** This software is intended for personal learning and testing purposes.

## Install

`npm i [-g] web-tree-crawler`


## JS

### Usage

```js
/**
 * This is the main exported function that crawls and resolves the URL tree.
 *
 * @param  {String}   url
 * @param  {Object}   [opts = {}]
 * @param  {Number}   [opts.batchSize = 200] - the number of requests to send at a time
 * @param  {String[]} [opts.startPaths]      - paths to initially crawl
 * @param  {Boolean}  [opts.stringify]       - stringify the tree
 * @param  {Number}   [opts.timeLimit = 120] - the max number of seconds to run for
 * @param  {}         [opts....]             - additional options for #lib.request()
 *
 * @return {Promise}
 */
const crawl = async (url, opts = {}) => {
  ...
}
```

### Example

```js
'use strict'

const crawl = require('web-tree-crawler')

crawl(url, opts)
  .then(tree => { ... })
  .catch(err => { ... })
```

## CLI

### Usage

```
Usage: [OPTION=] web-tree-crawler URL

Options:
  BATCH_SIZE    The number of requests to send at a time (default=200)
  OUTFILE       Write the result to file instead of stdout
  TIME_LIMIT    The max number of seconds to run (default=120)
```

### Examples

#### Crawl and print tree to stdout

```
$ web-tree-crawler URL

.com
  .domain
    .subdomain1
      /foo
        /bar
      .subdomain-of-subdomain1
        /baz
          ?q=1
    .subdomain2
...
```

#### Crawl and write tree to file

```
$ OUTFILE=/path/to/file web-tree-crawler URL

Wrote tree to file!
```

## Test

`npm test`

## Lint

`npm run lint`

## Documentation

`npm run doc`

Generate the docs and open in browser.

## Contributing

Please do!

If you find a bug, want a feature added, or just have a question, feel free to [open an issue](https://github.com/zbo14/web-tree-crawler/issues/new). In addition, you're welcome to [create a pull request](https://github.com/zbo14/web-tree-crawler/compare/develop...) addressing an issue. You should push your changes to a feature branch and request merge to `develop`.

Make sure linting and tests pass and coverage is 💯 before creating a pull request!
