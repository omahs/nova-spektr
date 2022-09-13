import webpack, { Configuration } from 'webpack';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import SimpleProgressWebpackPlugin from 'simple-progress-webpack-plugin';

import { APP_CONFIG } from '../app.config';

export const getSwcConfig = (isDev: boolean) => {
  return {
    sourceMaps: isDev,
    minify: !isDev,
    jsc: {
      parser: {
        target: 'es2021',
        syntax: 'typescript',
        jsx: true,
        tsx: true,
        dynamicImport: true,
        allowJs: true,
      },
      transform: {
        react: {
          pragma: 'React.createElement',
          pragmaFrag: 'React.Fragment',
          throwIfNamespace: true,
          runtime: 'automatic',
          development: isDev,
          refresh: isDev,
        },
      },
    },
  };
};

const sharedConfig: Configuration = {
  stats: 'errors-only',

  optimization: {
    usedExports: true,
  },

  module: {
    rules: [
      {
        test: /\.(js|ts|jsx|tsx)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'swc-loader',
            options: getSwcConfig(process.env.NODE_ENV === 'development'),
          },
        ],
      },
      {
        test: /\.svg$/,
        use: [
          {
            loader: '@svgr/webpack',
            options: {
              svgoConfig: {
                plugins: [{ name: 'removeViewBox', active: false }],
              },
            },
          },
          {
            loader: 'file-loader',
            options: {
              name: '[name]-[hash:8].[ext]',
              outputPath: 'images/',
            },
          },
        ],
      },
      {
        test: /\.wasm$/,
        type: 'asset/resource',
      },
      {
        test: /\.(png|jpeg|gif|webp)$/,
        type: 'asset/resource',
        generator: {
          filename: 'images/[name]-[hash:8][ext]',
        },
      },
      {
        test: /\.woff2$/,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name][ext]',
        },
      },
    ],
  },

  resolve: {
    extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
    plugins: [new TsconfigPathsPlugin({})],
    fallback: {
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      buffer: require.resolve('buffer'),
      fs: false,
      path: false,
    },
  },

  plugins: [
    new SimpleProgressWebpackPlugin({ format: 'minimal' }),

    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    }),

    new webpack.DefinePlugin({
      'process.env': {
        PRODUCT_NAME: JSON.stringify(APP_CONFIG.TITLE),
        VERSION: JSON.stringify(APP_CONFIG.VERSION),
      },
    }),
  ],
};

export default sharedConfig;
