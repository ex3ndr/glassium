//
// Parameters
//

const IS_NEXT = process.env.APP_ENV !== 'production';
const RUNTIME_VERSION = "12";

//
// Config
//

export default {
  "expo": {
    "name": "Glassium",
    "slug": "bubble",
    "version": "1.2.0",
    "runtimeVersion": RUNTIME_VERSION,
    "orientation": "portrait",
    "icon": IS_NEXT ? './assets/icon_next.png' : "./assets/icon.png",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "dark",
    "scheme": "glassium",
    "splash": {
      "backgroundColor": "#000"
    },
    "androidStatusBar": {
      "barStyle": "light-content",
      "backgroundColor": "#121212",
      "translucent": false
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "backgroundColor": "#121212",
      "supportsTablet": true,
      "bundleIdentifier": "com.bubbleapp.ios",
      "associatedDomains": ["applinks:glassium.org"],
      "infoPlist": {
        "UIBackgroundModes": [
          "fetch",
          "remote-notification",
          "bluetooth-central"
        ],
        "UIViewControllerBasedStatusBarAppearance": true,
        "NSMicrophoneUsageDescription": "Bubble uses the microphone to record audio to be analyzed by AI."
      },
      "config": {
        "usesNonExemptEncryption": false
      }
    },
    "android": {
      "backgroundColor": "#121212",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#000"
      },
      "package": "com.bubbleapp.android",
      "permissions": [
        "android.permission.BLUETOOTH",
        "android.permission.BLUETOOTH_ADMIN",
        "android.permission.BLUETOOTH_CONNECT"
      ],
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [
            {
              "scheme": "https",
              "host": "glassium.org",
              "pathPrefix": "/"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      [
        "react-native-ble-plx",
        {
          "neverForLocation": true,
          "isBackgroundEnabled": true,
          "bluetoothAlwaysPermission": "Allow $(PRODUCT_NAME) to connect to wearable devices via bluetooth",
        }
      ],
      "expo-localization",
      "onnxruntime-react-native",
      "react-native-vision-camera",
      [
        "expo-build-properties",
        {
          "android": {
            "minSdkVersion": 31
          }
        }
      ],
      ["expo-router", {
        "root": "./sources/app/routes",
      }]
    ],
    "extra": {
      "eas": {
        "projectId": "37bd4d62-0528-40ac-9dfb-4a9b2d172597"
      },
      "bugsnag": {
        "apiKey": "d6752ef54836994437180027a581b761"
      }
    },
    "owner": "bulkacorp",
    "updates": {
      "url": "https://u.expo.dev/37bd4d62-0528-40ac-9dfb-4a9b2d172597"
    },
    "experiments": {
      "typedRoutes": true
    }
  }
}
