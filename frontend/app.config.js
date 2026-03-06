require('dotenv').config();

/** @type {import('@expo/config').ConfigContext} */
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    googleServicesFile: './google-services.json',
  },
  plugins: [
    './plugins/withFirebaseAndroid',
    ...config.plugins,
  ],
});
