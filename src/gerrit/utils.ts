export function isValidNumber(value: string, error: string = "Not a Number"): string {
    if (isNaN(parseInt(value))) {
        return error;
    } else {
        return null;
    }
}

export function filterDuplicates(value: string, index: number, array: string[]): boolean {
    return value.length !== 0 && array.lastIndexOf(value) === index;
}

export function setDefault<T>(variable: T, defaultValue: T): T {
    return (variable === null || variable === undefined) ? defaultValue : variable;
}

export const SPLIT_LINE = /\n\r??/gmi;