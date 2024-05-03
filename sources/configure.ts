import Bugsnag from '@bugsnag/expo';
Bugsnag.start({ releaseStage: __DEV__ ? 'dev' : 'production' });

import { LogBox } from "react-native";
LogBox.ignoreAllLogs();