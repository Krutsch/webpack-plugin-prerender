# webpack-plugin-prerender

> Prerender HTML and reduce JS while bundling.

## Install

```
$ npm install --save-dev webpack-plugin-prerender
```

## Usage

Make sure, that .html get emitted. Use `html-webpack-plugin` for example.

```js
// webpack.config.js
const PreRenderPlugin = require("webpack-plugin-prerender");

module.exports = {
  // ...
  plugins: [
    new PreRenderPlugin({
      externals: ["framework"],
      test: /\.m?(ts|js)x?$/,
      functionCalls: ["render"],
      patterns: [],
      exclude: /node_modules/,
      browser: "chromium",
    }),
  ],
};
```

## API

#### options.externals

Type: `Array<libraries: string>`<br>
Default: `[]`

Use the same externals Array that is used for [webpack](https://webpack.js.org/configuration/externals/)

#### options.test

Type: `RegExp`<br>
Default: `/\.js\$/`

Determines which JS/TS files should be stripped.

#### options.functionCalls

Type: `Array<functionNames: string>`<br>
Default: `[]`

Which functions should be removed from the bundle.

#### options.patterns

Type: `Array<{ regex: RegExp, value: string }>`<br>
Default: `[]`

Replace further code from the asset.

#### options.exclude

Type: `RegExp`<br>
Default: `/node_modules/`

Which asset files you do not want to change.

#### options.browser

Type: `Browser from Playwright: string`<br>
Default: `chromium`

Possible values are ['chromium', 'firefox', 'webkit'].
