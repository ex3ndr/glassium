//
// Parameters
//

const IS_NEXT = process.env.APP_ENV !== 'production';
const RUNTIME_VERSION = "9";

//
// Config
//

export default {
  "expo": {
    "name": "Bubble",
    "slug": "bubble",
    "version": "1.1.0",
    "runtimeVersion": RUNTIME_VERSION,
    "orientation": "portrait",
    "icon": IS_NEXT ? './assets/icon_next.png' : "./assets/icon.png",
    "userInterfaceStyle": "dark",
    "splash": {
      "backgroundColor": "#000"
    },
    "androidStatusBar": {
      "barStyle": "light-content",
      "backgroundColor": "#00000000",
      "translucent": false
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "backgroundColor": "#000",
      "supportsTablet": false,
      "bundleIdentifier": "com.bubbleapp.ios",
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
      "backgroundColor": "#000",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#000"
      },
      "package": "com.bubbleapp.android",
      "permissions": [
        "android.permission.BLUETOOTH",
        "android.permission.BLUETOOTH_ADMIN",
        "android.permission.BLUETOOTH_CONNECT"
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
          "isBackgroundEnabled": true
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
      ]
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
    }
  }
}
