export function inferVendorFromName(name: string): 'compass' | 'friend' | 'bubble' {
    if (name.toLowerCase().includes('compass')) return 'compass';
    if (name.toLowerCase().includes('friend')) return 'friend';
    return 'bubble';
}