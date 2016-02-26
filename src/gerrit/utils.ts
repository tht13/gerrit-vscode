export function isValidNumber(value: string, error: string = "Not a Number"): string {
    if (isNaN(parseInt(value))) {
        return error;
    } else {
        return null;
    }
}
