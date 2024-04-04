import axios, { Axios } from 'axios';

const ONBOARDING_VERSION = 1; // Increment this to reset onboarding

export type OnboardingState = {
    kind: 'prepare'
} | {
    kind: 'need_username'
} | {
    kind: 'need_profile'
} | {
    kind: 'need_push'
};

export type GlobalState = {
    kind: 'empty'
} | {
    kind: 'onboarding',
    state: OnboardingState,
    token: string,
    client: Axios
} | {
    kind: 'ready',
    token: string,
    client: Axios
};