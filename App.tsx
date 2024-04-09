import * as React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Button, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { openDevice, startBluetooth } from './sources/modules/bt';
import { useDebugLog } from './sources/utils/useDebugLog';
import { useAsyncCommand } from './sources/utils/useAsyncCommand';
import { delay } from './sources/utils/time';
import { BTCharacteristic, BTDevice, KnownBTServices } from './sources/modules/bt_common';
import { connectAsync, disconnectAsync, startAsync } from './modules/hardware';
import { WaveFile } from 'wavefile';
import { ProtocolDefinition, resolveProtocol, startPacketizer } from './sources/modules/protocol';
import { decode } from './sources/modules/decode';

export default function App() {
  const [logs, log] = useDebugLog();
  const lastDevice = React.useRef<BTDevice | null>(null);
  const [w, setW] = React.useState<string | null>(null);
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
    let device = lastDevice.current || await openDevice({ name: ['Super', 'Friend', 'Compass'] });
    if (device === null) {
      log('Failed to open device');
      return;
    }
    lastDevice.current = device;
    log('Device opened:' + device.name + ' (' + device.id + ')');
    for (let service of device.services) {
      log('Service:' + service.id);
      for (let characteristic of service.characteristics) {
        log('- Characteristic:' + characteristic.id);
        log('  - canRead:' + characteristic.canRead);
        log('  - canWrite:' + characteristic.canWrite);
        log('  - canNotify:' + characteristic.canNotify);
      }
    }

    // Try to find protocol
    let target: ProtocolDefinition | null = null;
    let protocol = await resolveProtocol(device);
    if (protocol) {
      if (protocol.kind !== 'super' && protocol.kind !== 'compass') {
        log('Unsupported protocol');
      } else {
        target = protocol;
      }
    }
    if (!target) {
      log('Target protocol not found');
      return;
    }
    log('Target protocol found:' + target.codec);

    // Subscribe
    log('Waitign for data...');
    let total = 0;
    let total_packets = 0;
    let packetizer = startPacketizer(target.kind === 'super');
    let sub = target.source.subscribe((data) => {
      total += data.length;
      total_packets += 1;
      packetizer.add(data);
    });
    await delay(10000);
    let { frames, lost } = packetizer.build();
    sub();

    // Done
    log('Total received:' + total + ' bytes, speed:' + (total / 10) + ' bytes/sec, lost: ' + lost + ' packets or ' + total_packets + ' packets');
    log('Total frames:' + frames.length);

    // Decode
    log('Decoding...');
    const wav = await decode(target.codec, frames);
    if (!wav) {
      log('Failed to decode');
      return;
    }
    const base64Wav = wav.toBase64();
    setW(`data:audio/wav;base64,${base64Wav}`);
    log('Done!');
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
        {w && (
          <audio controls>
            <source src={w} type="audio/wav" />
          </audio>
        )}
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
