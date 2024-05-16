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
    name: string,
    services: string[]
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
    // static readonly isPersistent: boolean;
    // static readonly supportsScan: boolean;
    // static readonly supportsPick: boolean;

    // Bluetooth Init
    start(): Promise<BluetoothStartResult>;

    // Device scan and picking
    startScan(handler: (device: BTDiscoveredDevice) => void): void;
    stopScan(): void;
    pick(services: string[]): Promise<BTDiscoveredDevice | null>;

    // Device connection
    connect(id: string, timeout: number): Promise<BTDevice | null>;
}