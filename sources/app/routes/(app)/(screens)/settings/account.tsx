import { Item } from '@/app/components/Item';
import { RoundButton } from '@/app/components/RoundButton';
import { useAlert } from '@/app/libs/alert';
import { Theme } from '@/app/theme';
import { useAppModel } from '@/global';
import { cleanAndReload } from '@/modules/reload/cleanAndReload';
import * as React from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default React.memo(() => {
    const appModel = useAppModel();
    const alert = useAlert();
    const dev = appModel.profile.useDeveloperMode();

    const deleteAction = async () => {

        // Confirm
        let res = await alert('Are you sure?', 'This action will delete your account and all associated data.', [{ text: 'Delete', style: 'destructive' }, { text: 'Cancel', style: 'cancel' }]);
        if (res !== 0) {
            return;
        }

        // Delete
        await appModel.client.accountDelete();

        // Reset app
        await cleanAndReload();
    };
    const logoutAction = async () => {

        // Confirm
        let res = await alert('Are you sure?', 'You will need to login again to get an access to your memories.', [{ text: 'Logout', style: 'destructive' }, { text: 'Cancel', style: 'cancel' }]);
        if (res !== 0) {
            return;
        }

        // Reset app
        await cleanAndReload();
    };

    const enableDeveloperMode = async () => {
        await appModel.profile.enableDeveloperMode();
    }

    return (
        <View>
            <Item title="Developer Mode" />
            <View style={{ alignItems: 'flex-start', paddingHorizontal: 16, flexDirection: 'column' }}>
                <Text style={{ fontSize: 18, color: Theme.text, marginBottom: 16, opacity: 0.8 }}>Enable developer mode to unlock API to work with your data</Text>
                {dev
                    ? <Text style={{ fontSize: 18, color: Theme.text, opacity: 0.8, fontStyle: 'italic' }}>Developer mode enabled</Text>
                    : <RoundButton title={'Enable Developer Mode'} size='small' action={enableDeveloperMode} />
                }
            </View>
            <View style={{ height: 32 }} />
            <Item title="Delete account" />
            <View style={{ alignItems: 'flex-start', paddingHorizontal: 16, flexDirection: 'column' }}>
                <Text style={{ fontSize: 18, color: Theme.text, marginBottom: 16, opacity: 0.8 }}>Delete your account and all associated data. Can't be reversed.</Text>
                <RoundButton title={'Delete Account'} size='small' action={deleteAction} />
            </View>
            <View style={{ height: 32 }} />
            <Item title="Logout" />
            <View style={{ alignItems: 'flex-start', paddingHorizontal: 16, flexDirection: 'column' }}>
                <Text style={{ fontSize: 18, color: Theme.text, marginBottom: 16, opacity: 0.8 }}>Logout from your account</Text>
                <RoundButton title={'Logout Account'} size='small' action={logoutAction} />
            </View>
        </View>
    );
});