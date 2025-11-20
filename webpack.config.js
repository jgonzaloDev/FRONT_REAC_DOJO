const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const fs = require('fs')
const { ModuleFederationPlugin } = require('webpack').container

module.exports = {
  mode: 'development',
  entry: path.resolve(__dirname, 'src', 'main.jsx'),
  output: {
    publicPath: 'auto',
    clean: true,
  },
  devServer: {
    port: 3002,
    historyApiFallback: true,
  },
  resolve: {
    extensions: ['.js', '.jsx', '.json'],
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
          },
        },
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new ModuleFederationPlugin({
      // expose as 'ordenes' so the container can import('ordenes/App')
      name: 'ordenes',
      filename: 'remoteEntry.js',
      exposes: {
        // expose the Orders page as ./App so existing container imports keep working
        './App': './src/pages/Orders.jsx'
      },
      // NOTE: some hosts/remotes may expect eager consumption of react/react-dom.
      // Marking eager: true here avoids the runtime error "Shared module is not available for eager consumption"
      // (alternative: align all apps/host to use the same shared config with eager:false and ensure host provides react)
      shared: {
        // Let the container provide React. Do not mark eager here to avoid duplicate React loads.
        react: { singleton: true, eager: false, requiredVersion: false },
        'react-dom': { singleton: true, eager: false, requiredVersion: false }
      },
    }),
    (() => {
      const templatePath = path.resolve(__dirname, 'public', 'index.html')
      let templateContent
      if (fs.existsSync(templatePath)) {
        // read the file content and pass it directly to HtmlWebpackPlugin to avoid child-compilation edge cases
        templateContent = fs.readFileSync(templatePath, 'utf8')
      } else {
        templateContent = `<!doctype html><html lang="es"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Example App (remote)</title></head><body><div id="root"></div></body></html>`
      }
      return new HtmlWebpackPlugin({ templateContent })
    })(),
  ],
}
