export interface SendInputs {
    message: string;
    address: string;
    amount: string;
}
export type InputName = keyof SendInputs;
