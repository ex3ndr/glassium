import * as FileSystem from 'expo-file-system';
import * as ZipRaw from 'react-native-zip-archive';

export async function readFileAsync(urlOrPath: string, encoding: 'utf8' | 'base64') {
    return await FileSystem.readAsStringAsync(urlOrPath, { encoding });
}

export async function writeAsStringAsync(urlOrPath: string, data: string, encoding: 'utf8' | 'base64') {
    await FileSystem.writeAsStringAsync(urlOrPath, data, { encoding });
}

export async function makeDirectoryAsync(directory: string) {
    await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + directory, { intermediates: true });
}

export async function zip(files: string[], destination: string) {
    files = files.map((v) => FileSystem.documentDirectory + v);
    await ZipRaw.zip(files, `${FileSystem.documentDirectory}${destination}`);
}