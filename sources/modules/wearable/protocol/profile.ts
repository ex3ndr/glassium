import * as z from 'zod'
import { ProtocolDefinition } from "./protocol"
import { BTDevice } from '../bluetooth/types'

export type DeviceProfile = {
    id: string,
    vendor: 'compass' | 'friend' | 'bubble',
    name: string,
    features?: {
        hasMuteSwitch?: true, // Device has mute switch
        hasOffSwitch?: true // Device has off switch
    }
}

export const profileCodec = z.object({
    id: z.string(),
    name: z.string(),
    vendor: z.union([z.literal('compass'), z.literal('friend'), z.literal('bubble')]),
    features: z.object({
        hasMuteSwitch: z.literal(true).optional(),
        hasOffSwitch: z.literal(true).optional()
    }).optional()
})

export async function loadDeviceProfile(protocol: ProtocolDefinition, device: BTDevice): Promise<DeviceProfile | null> {
    if (protocol.kind === 'compass') {
        return {
            id: device.id,
            vendor: 'compass',
            name: device.name,
        } satisfies DeviceProfile;
    }
    if (protocol.kind === 'super') {
        return {
            id: device.id,
            vendor: device.name.toLowerCase().startsWith('friend') ? 'friend' : 'bubble',
            name: device.name,
            features: { // TODO: Read from characteristics
                hasMuteSwitch: device.name.toLowerCase().startsWith('Friend') ? undefined : true,
                hasOffSwitch: device.name.toLowerCase().startsWith('Friend') ? true : undefined
            }
        } satisfies DeviceProfile;
    }
    return null;
}