import * as React from 'react';
import { useAppModel } from '@/global';
import { router } from 'expo-router';
import { VoiceRecordFragment } from '@/app/fragments/VoiceRecordFragment';

export default React.memo(() => {
    const app = useAppModel();
    const completed = async (skipped: boolean) => {
        if (!skipped) {
            await app.profile.reloadProfile();
        }
        router.back();
    }
    return (
        <VoiceRecordFragment client={app.client} skippable={false} completed={completed} />
    );
});