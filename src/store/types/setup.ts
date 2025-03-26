export type SetupTitleParams = Record<string, string>;

export interface SetupState {
    setupComplete: boolean;
    hardwarePhaseComplete: boolean;
    miningUnlocked: boolean;
    setupProgress: number;
    setupTitle: string;
    setupTitleParams: SetupTitleParams;
}
