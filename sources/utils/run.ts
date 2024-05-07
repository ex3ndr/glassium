export function run(command: () => Promise<void>) {
    (async () => {
        await command();
    })()
}