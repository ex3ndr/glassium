import { BTDiscoveredDevice } from "../bluetooth/types";

export function isDiscoveredDeviceSupported(src: BTDiscoveredDevice) {
    let n = src.name.toLowerCase();
    return n.startsWith('super') || n.startsWith('compass') || n.startsWith('bubble') || n.startsWith('friend');
}