const MAX_WORD = 65536;

export function unsignToSign(UnSignVar: number) {
    let HWord = 32767, SignVar;
    if (UnSignVar > HWord) {
        SignVar = UnSignVar - MAX_WORD;
    } else {
        SignVar = UnSignVar;
    }
    return SignVar;
}

export function isNumeric(n: any) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}
