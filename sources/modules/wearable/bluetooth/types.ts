export type BluetoothStartResult = 'started' | 'denied' | 'failure';

export type BTDevice = {
    id: string,
    name: string,
    services: BTService[],
    connected: boolean,
    onDisconnected: (callback: () => void) => (() => void),
    disconnect: () => Promise<void>
};

export type BTDiscoveredDevice = {
    id: string,
    name: string
}

export type BTService = {
    id: string,
    characteristics: BTCharacteristic[]
};

export type BTCharacteristic = {
    id: string,
    canRead: boolean,
    canWrite: boolean,
    canNotify: boolean,

    read: () => Promise<Uint8Array>,
    write: (data: Uint8Array) => Promise<void>,
    subscribe: (callback: (data: Uint8Array) => void) => (() => void)
};

export interface BluetoothModelInterface {
    readonly isPersistent: boolean;
    readonly supportsScan: boolean;
    readonly supportsPick: boolean;

    // Bluetooth Init
    start(): Promise<BluetoothStartResult>;

    // Device scan and picking
    startScan(handler: (device: BTDiscoveredDevice) => void): void;
    stopScan(): void;
    pick(): Promise<BTDiscoveredDevice | null>;

    // Device connection
    connect(id: string): Promise<BTDevice | null>;
}