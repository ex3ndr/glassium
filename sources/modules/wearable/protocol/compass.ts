const data = [
    { percentage: 100, voltage: 4.18 },
    { percentage: 95, voltage: 4.15 },
    { percentage: 90, voltage: 4.11 },
    { percentage: 85, voltage: 4.08 },
    { percentage: 80, voltage: 4.02 },
    { percentage: 75, voltage: 3.98 },
    { percentage: 70, voltage: 3.95 },
    { percentage: 65, voltage: 3.91 },
    { percentage: 60, voltage: 3.87 },
    { percentage: 55, voltage: 3.85 },
    { percentage: 50, voltage: 3.84 },
    { percentage: 45, voltage: 3.82 },
    { percentage: 40, voltage: 3.8 },
    { percentage: 35, voltage: 3.79 },
    { percentage: 30, voltage: 3.77 },
    { percentage: 25, voltage: 3.75 },
    { percentage: 20, voltage: 3.73 },
    { percentage: 15, voltage: 3.71 },
    { percentage: 10, voltage: 3.69 },
    { percentage: 5, voltage: 3.61 },
    { percentage: 1, voltage: 3.27 },
];

export function convertCompassVoltage(src: number) {
    console.warn(src);
    let v = data.find((d) => d.voltage < src / 1000000000);
    if (v) {
        return v.percentage;
    }
    return 1;
}