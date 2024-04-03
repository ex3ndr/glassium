import * as React from 'react';
import { OpusDecoder } from 'opus-decoder';
import { StatusBar } from 'expo-status-bar';
import { Button, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { openDevice, startBluetooth } from './sources/modules/bt';
import { useDebugLog } from './sources/utils/useDebugLog';
import { useAsyncCommand } from './sources/utils/useAsyncCommand';
import { delay } from './sources/utils/time';
import { BTCharacteristic, BTDevice } from './sources/modules/bt_common';
import { connectAsync, disconnectAsync, startAsync } from './modules/hardware';
import { WaveFile } from 'wavefile';

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
    let device = lastDevice.current || await openDevice({ name: 'Super' });
    if (device === null) {
      log('Failed to open device');
      return;
    }
    lastDevice.current = device;
    log('Device opened:' + device.name + ' (' + device.id + ')');
    let target: BTCharacteristic | null = null;
    // let targetPSM: BTCharacteristic | null = null;
    for (let service of device.services) {
      log('Service:' + service.id);
      for (let characteristic of service.characteristics) {
        log('- Characteristic:' + characteristic.id);
        log('  - canRead:' + characteristic.canRead);
        log('  - canWrite:' + characteristic.canWrite);
        log('  - canNotify:' + characteristic.canNotify);
        // if (characteristic.canRead && characteristic.id.toLowerCase() === '19b10003-e8f2-537e-4f6c-d104768a1214') {
        //   targetPSM = characteristic;
        // }
        if (characteristic.canNotify && characteristic.id.toLowerCase() === '19b10001-e8f2-537e-4f6c-d104768a1214') {
          target = characteristic;
        }
      }
    }
    if (!target) {
      log('Target characteristic not found');
      return;
    }

    // Fetch PSM
    // log('Fetching PSM value...');
    // let buffer = await targetPSM.read();
    // if (buffer.length != 2) {
    //   log('Invalid data');
    //   return;
    // }
    // let dataView = new DataView(buffer.buffer);
    // let psm = dataView.getUint16(0, true);
    // log('PSM value: ' + psm);


    // Subscribe
    log('Waitign for data...');
    let total = 0;
    let total_packets = 0;
    let lost = 0

    // GATT
    let last: { p: number, f: number } | null = null;
    let frames: Uint8Array[] = [];
    let pending: Uint8Array = new Uint8Array();
    let sub = target.subscribe((data) => {
      total += data.length;
      total_packets += 1;

      // Parse packet
      let value = new Uint8Array(data);
      let index = (value[0]) + (value[1] << 8);
      let internal = value[2];
      let content = value.subarray(3);
      console.log('Received: ' + index + ' (' + internal + ') - ' + content.length + ' bytes');

      // Wait for first packet
      if (!last && internal !== 0) {
        return;
      }

      if (!last) { // Start of a new frame
        last = { p: index, f: internal };
        pending = content;
      } else {
        if (index !== last.p + 1) { // Lost frame - reset state
          console.warn('Lost frame (packet)');
          last = null;
          pending = new Uint8Array();
        } else {
          if (internal === 0) {// Start of a new frame
            frames.push(pending);
            pending = content;
            last.f = internal;
            last.p++;
          } else if (internal === last.f + 1) { // Continue frame
            pending = new Uint8Array([...pending, ...content]);
            last.f = internal;
            last.p++;
          } else {
            console.warn('Lost frame (internal)');
            last = null;
            pending = new Uint8Array();
          }
        }
      }

      // if (last !== null && (last + 1) !== index) {
      //   lost += index - (last + 1);
      // }
      // last = index
    });
    await delay(10000);
    sub();
    if (pending.length > 0) {
      frames.push(pending);
    }

    // Done
    log('Total received:' + total + ' bytes, speed:' + (total / 10) + ' bytes/sec, lost: ' + lost + ' packets or ' + total_packets + ' packets');
    log('Total frames:' + frames.length);

    // Decode
    log('Decoding...');
    console.warn(frames);
    const decoder = new OpusDecoder();
    await decoder.ready;

    let output = decoder.decodeFrames(frames);
    const wav = new WaveFile();
    wav.fromScratch(1, output.sampleRate, '32f', output.channelData[0]);
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
