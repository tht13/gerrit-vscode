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
    return (isNull(variable)) ? defaultValue : variable;
}

export function isNull(variable: any): boolean {
    return variable === null || variable === undefined;
}

export const SPLIT_LINE = /\n\r??/gmi;
