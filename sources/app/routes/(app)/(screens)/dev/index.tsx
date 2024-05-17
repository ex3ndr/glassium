import { Item } from '@/app/components/Item';
import { RoundButton } from '@/app/components/RoundButton';
import { TimeView } from '@/app/components/TimeView';
import { Theme } from '@/app/theme';
import { useClient } from '@/global';
import { backoff } from '@/utils/time';
import { useCached } from '@/utils/useCached';
import * as React from 'react';
import { ScrollView, Text, View } from 'react-native';

export default React.memo(() => {
    const client = useClient();
    const [tokens, sync] = useCached(() => client.personalTokens());
    const [generated, setGenerated] = React.useState<string | null>(null);
    const createToken = async () => {
        let token = await backoff(() => client.createPersonalToken());
        await sync.invalidateAndAwait();
        setGenerated(token.token);
    };
    const deleteToken = async (id: string) => {
        await backoff(() => client.deletePersonalToken(id));
        await sync.invalidateAndAwait();
    }
    const hideToken = () => {
        setGenerated(null);
    }

    return (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16 }}>
            <Item title="Personal Access Tokens" />
            <View style={{ marginHorizontal: 16, alignItems: 'flex-start', marginTop: 8, gap: 16 }}>
                {tokens === null && (
                    <Text style={{ color: Theme.text, fontSize: 18, fontStyle: 'italic' }}>Loading...</Text>
                )}
                {tokens !== null && tokens.length === 0 && (
                    <>
                        <Text style={{ color: Theme.text, fontSize: 18, fontStyle: 'italic' }}>No active tokens</Text>
                    </>
                )}
                {tokens !== null && tokens.length > 0 && (
                    <>
                        {tokens.map(token => (
                            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                                <Text style={{ color: Theme.text, fontSize: 18 }}>#{token.id}</Text>
                                <Text style={{ color: Theme.text, fontSize: 18 }}>Created <TimeView time={token.created} /></Text>
                                <Text style={{ color: Theme.text, fontSize: 18 }}>Used  {token.used ? <TimeView time={token.used} /> : 'never'}</Text>
                                <RoundButton title="Delete" size="small" action={() => deleteToken(token.id)} />
                            </View>
                        ))}
                    </>
                )}
                {!generated && (
                    <RoundButton title="Generate new token" size="normal" action={createToken} />
                )}
                {generated && (
                    <View style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 16 }}>
                        <Text style={{ color: Theme.text, fontSize: 18, fontStyle: 'italic' }}>✨ Token generated, but you will never see it again!</Text>
                        <Text style={{ color: Theme.text, fontSize: 18 }} selectable={true}>{generated}</Text>
                        <RoundButton title="Close" size="small" onPress={hideToken} />
                    </View>
                )}
            </View>
        </ScrollView>
    );
});