const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

const sharedDir = path.resolve(__dirname, '../shared');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * watchFolders includes the shared/ package so Metro can resolve
 * imports from '../../../shared/src/...'
 */
const config = {
    watchFolders: [sharedDir],
    resolver: {
        extraNodeModules: {
            shared: sharedDir,
        },
    },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
