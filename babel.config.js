module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '~api': './src/api',
          '~types': './src/types',
          '~utils': './src/utils',
          '~theme': './src/theme',
          '~screens': './src/screens',
          '~components': './src/components',
          '~services': './src/services'
        }
      }
    ]
  ]
};
