import PostHog from "posthog-react-native";
import { PostHogCaptureOptions } from "posthog-react-native/lib/posthog-core/src";

const posthog = new PostHog(process.env.EXPO_PUBLIC_POSTHOG_TOKEN!, { disabled: __DEV__, host: process.env.EXPO_PUBLIC_POSTHOG_HOST });

export function track(event: string, properties?: { [key: string]: any; }, options?: PostHogCaptureOptions) {
    getPostHog().capture(event, properties, options);
}

export function getPostHog() {
    return posthog;
}

let identitySet = false;
export function posthogIdentity(id: string) {
    if (identitySet) {
        return;
    }
    identitySet = true;
    getPostHog().identify(id);
}