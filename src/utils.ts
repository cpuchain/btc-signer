export const chunk = <T>(arr: T[], size: number): T[][] =>
    [...Array(Math.ceil(arr.length / size))].map((_, i) =>
        arr.slice(size * i, size + size * i),
    );

export const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

export function checkHex(hexStr: string) {
    try {
        if (hexStr.slice(0, 2) !== '0x') {
            return false;
        }

        BigInt(hexStr);
        return true;
    } catch {
        return false;
    }
}
