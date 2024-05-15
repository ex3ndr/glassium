export const texts = {
    bt_denied: {
        title: 'Bluetooth permission',
        message: 'Glassium needs a bluetooth permission to connect to your device. Please, open settings and allow bluetooth for this app.',
        message_small: 'Open settings and allow bluetooth for this app.'
    },
    bt_unavailable: {
        title: 'Bluetooth unavailable',
        message: 'Unfortunatelly this device doesn\'t have a bluetooth and Glassium can\'t connect to any device.'
    },
    bt_pairing: {
        title: 'Pairing needed',
        message: 'Connect a new device',
        message_small: 'Connect a new device'
    },
    bt_disconnected: {
        title: 'Disconnected',
        message: 'Device disconnected. Some experiences may be lost.',
        message_small: 'Device disconnected'
    },
    bt_online: {
        title: 'Online',
        message: 'AI is connected to your device and collects experiences around you.',
        message_small: 'Device is online'
    },
} as const;