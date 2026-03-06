const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withFirebaseAndroid(config) {
  return withDangerousMod(config, [
    'android',
    (modConfig) => {
      const {
        FIREBASE_PROJECT_NUMBER,
        FIREBASE_PROJECT_ID,
        FIREBASE_STORAGE_BUCKET,
        FIREBASE_MOBILESDK_APP_ID,
        FIREBASE_ANDROID_PACKAGE_NAME,
        FIREBASE_API_KEY,
      } = process.env;

      const missing = Object.entries({
        FIREBASE_PROJECT_NUMBER,
        FIREBASE_PROJECT_ID,
        FIREBASE_STORAGE_BUCKET,
        FIREBASE_MOBILESDK_APP_ID,
        FIREBASE_ANDROID_PACKAGE_NAME,
        FIREBASE_API_KEY,
      })
        .filter(([, v]) => !v)
        .map(([k]) => k);

      if (missing.length > 0) {
        throw new Error(
          `Missing Firebase environment variables: ${missing.join(', ')}. ` +
            'Copy .env.example to .env and fill in the values.'
        );
      }

      const googleServices = {
        project_info: {
          project_number: FIREBASE_PROJECT_NUMBER,
          project_id: FIREBASE_PROJECT_ID,
          storage_bucket: FIREBASE_STORAGE_BUCKET,
        },
        client: [
          {
            client_info: {
              mobilesdk_app_id: FIREBASE_MOBILESDK_APP_ID,
              android_client_info: {
                package_name: FIREBASE_ANDROID_PACKAGE_NAME,
              },
            },
            oauth_client: [],
            api_key: [{ current_key: FIREBASE_API_KEY }],
            services: {
              appinvite_service: { other_platform_oauth_client: [] },
            },
          },
        ],
        configuration_version: '1',
      };

      const dest = path.resolve(
        modConfig.modRequest.projectRoot,
        'google-services.json'
      );
      fs.writeFileSync(dest, JSON.stringify(googleServices, null, 2));

      return modConfig;
    },
  ]);
};
