const path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/background.js', 
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'background.bundle.js'
  },
  target: 'webworker', 
  resolve: {
    fallback: {
      "path": require.resolve("path"),
      "fs": false,
      "os": false
    }
  }
};
