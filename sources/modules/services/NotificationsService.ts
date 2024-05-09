import * as Notifications from 'expo-notifications';
import { backoff } from "../../utils/time";
import { BubbleClient } from "../api/client";

export class NotificationsService {
    readonly client: BubbleClient;

    constructor(client: BubbleClient) {
        this.client = client;

        if (!__DEV__) {
            backoff(async () => {

                // Request permissions
                let permission = await Notifications.getPermissionsAsync();
                if (!permission.granted) {
                    return;
                }

                // Get token
                let token = await Notifications.getExpoPushTokenAsync();

                // Register push token
                await this.client.registerPushToken(token.data);
            });
        }
    }
}