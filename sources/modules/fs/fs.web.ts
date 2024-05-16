export async function readFileAsync(urlOrPath: string, encoding: 'utf8' | 'base64') {

    // Handle blob URLs
    if (urlOrPath.startsWith('blob:')) {
        const blob = await fetch(urlOrPath).then(res => res.blob());
        return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                let b = reader.result as string;
                let i = b.indexOf('base64,');
                b = b.slice(i + 7);
                resolve(b);
            }
            reader.onerror = () => reject(reader.error);
            if (encoding === 'utf8') {
                reader.readAsText(blob);
            } else {
                reader.readAsDataURL(blob);
            }
        });
    }

    throw new Error('Not implemented');
}

export async function writeAsStringAsync(urlOrPath: string, data: string, encoding: 'utf8' | 'base64') {
    throw new Error('Not implemented');
}

export async function makeDirectoryAsync(directory: string) {
    throw new Error('Not implemented');
}

export async function zip(files: string[], destination: string) {
    throw new Error('Not implemented');
}