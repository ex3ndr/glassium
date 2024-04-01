import * as React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Button, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { openDevice, startBluetooth } from './sources/modules/bt';
import { useDebugLog } from './sources/utils/useDebugLog';
import { useAsyncCommand } from './sources/utils/useAsyncCommand';
import { delay } from './sources/utils/time';
import { BTCharacteristic } from './sources/modules/bt_common';
import { connectAsync, startAsync } from './modules/hardware';

export default function App() {
  const [logs, log] = useDebugLog();
  const [executing, execute] = useAsyncCommand(async () => {

    log('Starting L2CAP bluetooth...');
    await startAsync();

    // Staring bluetooth
    log('Starting bluetooth...');
    let results = await startBluetooth();
    log('Bluetooth started:' + results);
    if (results !== 'started') {
      log('Failed to start bluetooth');
      return;
    }

    // Open device
    log('Opening device...');
    let device = await openDevice({ name: 'Super' });
    if (device === null) {
      log('Failed to open device');
      return;
    }
    log('Device opened:' + device.name + ' (' + device.id + ')');
    let target: BTCharacteristic | null = null;
    for (let service of device.services) {
      log('Service:' + service.id);
      for (let characteristic of service.characteristics) {
        log('- Characteristic:' + characteristic.id);
        log('  - canRead:' + characteristic.canRead);
        log('  - canWrite:' + characteristic.canWrite);
        log('  - canNotify:' + characteristic.canNotify);
        if (characteristic.canNotify && characteristic.id.toLowerCase() === '19b10001-e8f2-537e-4f6c-d104768a1214') {
          target = characteristic;
        }
      }
    }

    // L2CAP
    log('Connecting to l2cap...');
    await connectAsync(device.id);

    // Subscribe
    if (target === null) {
      log('Target characteristic not found');
      return;
    }
    log('Subscribing...');
    let total = 0;
    let sub = target.subscribe((data) => {
      // log('Received:' + data.length + ' bytes');
      total += data.length;
    });

    // Await for 10 seconds
    await delay(10000);

    // Unsubscribe
    log('Unsubscribing...');
    sub();

    // Done
    log('Done');
    log('Total received:' + total + ' bytes, speed:' + (total / 10) + ' bytes/sec');
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
