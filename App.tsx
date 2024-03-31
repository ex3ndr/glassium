import { StatusBar } from 'expo-status-bar';
import { Button, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { startBluetooth } from './sources/modules/bt';
import { useDebugLog } from './sources/utils/useDebugLog';
import React from 'react';
import { useAsyncCommand } from './sources/utils/useAsyncCommand';

export default function App() {
  const [logs, log] = useDebugLog();
  const [executing, execute] = useAsyncCommand(async () => {
    log('Starting bluetooth...');
    let results = await startBluetooth();
    log('Bluetooth started:' + results);
  });

  return (
    <>
      <StatusBar style="auto" />
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.logContainer}>
          {logs.map((log, index) => (
            <Text key={index} style={styles.logText}>
              {log}
            </Text>
          ))}
        </ScrollView>
        <Button title="Execute" onPress={execute} disabled={executing} />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  logContainer: {
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingVertical: 16,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    backgroundColor: '#f0f0f0',
    alignSelf: 'stretch',
  },
  logText: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
});
