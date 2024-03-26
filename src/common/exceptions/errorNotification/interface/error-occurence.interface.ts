
export interface ErrorOccurrence {
    count: number;
    lastOccurred: number;
}

export interface ErrorOccurrences {
    [key: string]: ErrorOccurrence;
}