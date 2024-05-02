import Bugsnag from '@bugsnag/expo';
Bugsnag.start();

import { LogBox } from "react-native";
LogBox.ignoreAllLogs();