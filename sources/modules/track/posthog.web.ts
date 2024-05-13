import PostHog, { PostHogCustomStorage } from "posthog-react-native";
import { POSTHOG_SERVER, POSTHOG_TOKEN } from "../../config";

const storage: PostHogCustomStorage = {
    getItem: (key: string) => {
        return localStorage.getItem('ph-' + key);
    },
    setItem: (key: string, value: string) => {
        localStorage.setItem('ph-' + key, value);
    }
};

export const posthog = new PostHog(POSTHOG_TOKEN!, { host: POSTHOG_SERVER, customStorage: storage });