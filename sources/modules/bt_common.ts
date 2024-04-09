export type BTStartResult = 'started' | 'denied' | 'failure';

export type BTDevice = {
    id: string,
    name: string,
    services: BTService[]
};

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

export const KnownBTServices = ['19B10000-E8F2-537E-4F6C-D104768A1214'.toLowerCase(), '4FAFC201-1FB5-459E-8FCC-C5C9C331914B'.toLowerCase()];