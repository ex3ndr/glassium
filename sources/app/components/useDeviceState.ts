import { useAppModel } from "@/global";

export type DeviceState = {
    paired: true,
    state: 'connected' | 'connecting' | 'denied' | 'unavailable',
    name: string,
    muted?: boolean,
    battery?: number,
    vendor: 'compass' | 'friend' | 'bubble'
} | {
    paired: false,
    state: 'denied' | 'unavailable' | 'pairing'
}

export function useDeviceState(): DeviceState {
    const app = useAppModel();
    const wearable = app.wearable.use();

    if (wearable.profile) {
        if (wearable.pairing === 'ready' && (wearable.device.status === 'connected' || wearable.device.status === 'subscribed')) {
            return {
                paired: true,
                state: 'connected',
                name: wearable.profile!.name,
                vendor: wearable.profile!.vendor,
                muted: wearable.device!.muted,
                battery: wearable.device!.battery !== null ? wearable.device!.battery : undefined
            }
        }
        if (wearable.pairing === 'ready' && (wearable.device.status === 'connecting' || wearable.device.status === 'disconnected')) {
            return {
                paired: true,
                state: 'connecting',
                name: wearable.profile!.name,
                vendor: wearable.profile!.vendor
            }
        }
        if (wearable.pairing === 'loading') {
            return {
                paired: true,
                state: 'connecting',
                name: wearable.profile!.name,
                vendor: wearable.profile!.vendor
            }
        }
        if (wearable.pairing === 'denied') {
            return {
                paired: true,
                state: 'denied',
                name: wearable.profile!.name,
                vendor: wearable.profile!.vendor
            }
        }
        if (wearable.pairing === 'unavailable') {
            return {
                paired: true,
                state: 'unavailable',
                name: wearable.profile!.name,
                vendor: wearable.profile!.vendor
            }
        }
    }

    if (wearable.pairing === 'denied') {
        return {
            paired: false,
            state: 'denied'
        }
    } else if (wearable.pairing === 'unavailable') {
        return {
            paired: false,
            state: 'unavailable'
        }
    }

    return {
        paired: false,
        state: 'pairing'
    }
}
