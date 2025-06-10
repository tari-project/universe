export interface SendInputs {
    message: string;
    address: string;
    amount?: number;
}
export type InputName = keyof SendInputs;
