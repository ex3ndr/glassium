import * as React from 'react';
import { useRefresh } from '../_resolve';
import { markSkipVoice, useClient } from '@/global';
import { VoiceRecordFragment } from '@/app/fragments/VoiceRecordFragment';

export default React.memo(() => {
    const refresh = useRefresh();
    const client = useClient();
    const complete = async (skipped: boolean) => {
        if (skipped) {
            markSkipVoice();
        }
        await refresh();
    }
    return (
        <VoiceRecordFragment client={client} skippable={true} completed={complete} />
    );
});