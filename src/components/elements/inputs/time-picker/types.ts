export const CYCLE = ['AM', 'PM'] as const;
type CycleTuple = typeof CYCLE;
type Cycle = CycleTuple[number];

export interface TimeParts {
    hour: string;
    minute: string;
    cycle: Cycle;
}
