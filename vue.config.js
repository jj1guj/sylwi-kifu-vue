/* eslint-disable @typescript-eslint/no-var-requires */
const CompressionPlugin = require("compression-webpack-plugin");
const { gzip } = require("@gfx/zopfli");
const zlib = require("zlib");
const IS_PROD = ["production", "prod"].includes(process.env.NODE_ENV);
//const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  publicPath: process.env.NODE_ENV === "production" ? "./" : "./",
  // productionSourceMap: false,
  configureWebpack: (config) => {
    config.resolve ??= {};
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };

    if (IS_PROD) {
      config.plugins = [
        ...config.plugins,
        new CompressionPlugin({
          algorithm: gzip,
          test: /\.(css|html|js|json|map|svg)$/,
          compressionOptions: { numiterations: 15 },
          minRatio: 0.99,
          deleteOriginalAssets: false,
        }),
        new CompressionPlugin({
          filename: "[path][base].br",
          algorithm: "brotliCompress",
          test: /\.(css|html|js|json|map|svg)$/,
          compressionOptions: {
            params: {
              [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
            },
          },
          minRatio: 0.99,
          deleteOriginalAssets: false,
        }),
        new CopyPlugin({
          patterns: [
            {
              from: "node_modules/noto-sans-cjk-jp/fonts/NotoSansCJKjp-Regular.woff",
              to: "font/[name].[ext]",
            },
            {
              from: "node_modules/noto-sans-cjk-jp/fonts/NotoSansCJKjp-Bold.woff",
              to: "font/[name].[ext]",
            },
            {
              from: "node_modules/kifu-for-js/src/images/*.png",
              to: "img/pieces/[name].[ext]",
            },
          ],
        }),
        //new BundleAnalyzerPlugin(),
      ];
      // Node.js v15 supports Logical assignment operators, but not before v14
      // Node.js v16 Active LTS will starts on 2021-10-26 ( https://nodejs.org/en/about/releases/ )
      config.performance ?? (config.performance = {});
      config.performance.maxEntrypointSize = 6000000;
      config.performance.maxAssetSize = 30000000;
    }
  },
};
