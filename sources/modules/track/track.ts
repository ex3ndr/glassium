import PostHog from "posthog-react-native";
import { PostHogCaptureOptions } from "posthog-react-native/lib/posthog-core/src";
import { POSTHOG_SERVER, POSTHOG_TOKEN } from "../../config";

const posthog = new PostHog(POSTHOG_TOKEN!, { host: POSTHOG_SERVER });

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