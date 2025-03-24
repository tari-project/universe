export type SetupTitleParams = Record<string, string>;

export interface SetupState {
    setupComplete: boolean;
    setupProgress: number;
    setupTitle: string;
    setupTitleParams: SetupTitleParams;
}
