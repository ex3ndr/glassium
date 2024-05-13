import PostHog from "posthog-react-native";
import { POSTHOG_SERVER, POSTHOG_TOKEN } from "../../config";
export const posthog = new PostHog(POSTHOG_TOKEN!, { host: POSTHOG_SERVER });