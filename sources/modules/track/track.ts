import { PostHogCaptureOptions } from "posthog-react-native/lib/posthog-core/src";
import { posthog } from "./posthog";

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