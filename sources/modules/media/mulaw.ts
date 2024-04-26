const decodeTable = [0, 132, 396, 924, 1980, 4092, 8316, 16764];

export function fromMulaw(muLawSample: number) {
    muLawSample = ~muLawSample;
    const sign = (muLawSample & 0x80);
    const exponent = (muLawSample >> 4) & 0x07;
    const mantissa = muLawSample & 0x0F;
    let sample = decodeTable[exponent] + (mantissa << (exponent + 3));
    if (sign != 0) sample = -sample;
    return sample;
}