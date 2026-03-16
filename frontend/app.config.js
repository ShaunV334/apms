require('dotenv').config();

/** @type {import('@expo/config').ConfigContext} */
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
  },
  plugins: [
    './plugins/withFirebaseAndroid',
    ...config.plugins,
  ],
});
