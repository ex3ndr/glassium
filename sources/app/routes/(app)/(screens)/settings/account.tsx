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
    const safeArea = useSafeAreaInsets();
    const appModel = useAppModel();
    const alert = useAlert();

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

    return (
        <View>
            <Item title="Danger" />
            <View style={{ alignItems: 'flex-start', paddingHorizontal: 16, flexDirection: 'column' }}>
                <Text style={{ fontSize: 18, color: Theme.text, marginBottom: 8, opacity: 0.8 }}>Managing your account and associated data.</Text>
                <View style={{ gap: 16 }}>
                    <RoundButton title={'Logout Account'} size='small' action={logoutAction} />
                    <RoundButton title={'Delete Account'} size='small' action={deleteAction} />
                </View>
            </View>
        </View>
    );
});