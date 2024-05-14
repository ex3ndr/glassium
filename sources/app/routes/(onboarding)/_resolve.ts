import * as React from 'react';
import { GlobalState, useGlobalStateController } from "@/global";
import { router } from 'expo-router';
import { backoff } from '@/utils/time';

export function _resolve(src: GlobalState): string {
    if (src.kind === 'empty') {
        return '/(auth)';
    }
    if (src.kind === 'ready') {
        return '/(app)';
    }
    if (src.state.kind === 'prepare') {
        return '/(onboarding)';
    }
    if (src.state.kind === 'need_activation') {
        return '/(onboarding)/prepare/activate';
    }
    if (src.state.kind === 'need_name') {
        return '/(onboarding)/prepare/name';
    }
    if (src.state.kind === 'need_push') {
        return '/(onboarding)/prepare/notifications';
    }
    if (src.state.kind === 'need_username') {
        return '/(onboarding)/prepare/username';
    }
    throw new Error('Invalid state');
}

export function useRefresh() {
    const controller = useGlobalStateController();
    return React.useCallback(async () => {
        await backoff(async () => {
            let res = await controller.refresh();
            router.replace(_resolve(res) as any);
        });
    }, []);
}