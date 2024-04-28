import { BTCharacteristic, BTDevice } from "../bluetooth/types";

export const SUPER_SERVICE = '19b10000-e8f2-537e-4f6c-d104768a1214';
export const COMPASS_SERVICE = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
export const KNOWN_BT_SERVICES = [SUPER_SERVICE, COMPASS_SERVICE];

export type CodecType = 'pcm-16' | 'pcm-8' | 'mulaw-16' | 'mulaw-8' | 'opus-16';

export type ProtocolDefinition = {
    kind: 'super' | 'compass',
    codec: CodecType,
    source: BTCharacteristic
}

export function supportedDeviceNames(name: string) {
    if (['super', 'friend'].indexOf(name.toLowerCase()) >= 0) {
        return true;
    }
    if (name.toLowerCase().startsWith('compass')) {
        return true;
    }
    return false;
}


async function resolveSuperProtocol(device: BTDevice): Promise<ProtocolDefinition | null> {

    // Search for service
    let superService = device.services.find((v) => v.id === '19b10000-e8f2-537e-4f6c-d104768a1214')
    if (!superService) {
        return null;
    }

    // Search for audio characteristic
    let audioCharacteristic = superService.characteristics.find((v) => v.id === '19b10001-e8f2-537e-4f6c-d104768a1214');
    if (!audioCharacteristic) {
        return null;
    }

    // Search for codec characteristic
    let codecCharacteristic = superService.characteristics.find((v) => v.id === '19b10002-e8f2-537e-4f6c-d104768a1214');
    if (!codecCharacteristic) {
        return null;
    }
    let value = await codecCharacteristic.read();
    if (value.length < 1) {
        return null;
    }
    let codec: CodecType;
    let codecId = value[0];
    if (codecId === 0) {
        codec = 'pcm-16';
    } else if (codecId === 1) {
        codec = 'pcm-8';
    } else if (codecId === 10) {
        codec = 'mulaw-16'
    } else if (codecId === 11) {
        codec = 'mulaw-8'
    } else if (codecId === 20) {
        codec = 'opus-16'
    } else {
        console.warn('Unknown codec: ' + codecId);
        return null;
    }


    return {
        kind: 'super',
        codec,
        source: audioCharacteristic
    };
}

async function resolveCompasProtocol(device: BTDevice): Promise<ProtocolDefinition | null> {

    // Search for service
    let service = device.services.find((v) => v.id === '4fafc201-1fb5-459e-8fcc-c5c9c331914b')
    if (!service) {
        return null;
    }

    // Search for characteristic
    let audioCharacteristic = service.characteristics.find((v) => v.id === 'beb5483e-36e1-4688-b7f5-ea07361b26a8');
    if (!audioCharacteristic) {
        return null;
    }

    // Check that other characteristics are present since service id is from a sample code
    if (!service.characteristics.find((v) => v.id === '00002bed-0000-1000-8000-00805f9b34fb')) { // This one is battery level characteristic
        return null;
    }
    if (!service.characteristics.find((v) => v.id === '9f83442c-7da2-49ca-94e3-b06201a58508')) { // This one is not googlable
        return null;
    }

    return {
        kind: 'compass',
        codec: 'pcm-8' as const,
        source: audioCharacteristic
    };
}

export async function resolveProtocol(device: BTDevice): Promise<ProtocolDefinition | null> {

    let found = await resolveSuperProtocol(device);
    if (found) {
        return found;
    }

    found = await resolveCompasProtocol(device);
    if (found) {
        return found;
    }

    return null;
}