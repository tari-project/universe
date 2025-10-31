import { invoke } from '@tauri-apps/api/core';
import { useCallback, useState } from 'react';

export function useValidateTariAddress() {
    const [validationErrorMessage, setValidationErrorMessage] = useState<string | undefined>();
    const validateAddress = useCallback(async (address: string) => {
        try {
            await invoke('verify_address_for_send', { address });
            return true;
        } catch (e) {
            const error = e as Error;
            setValidationErrorMessage(error.message);
            return false;
        }
    }, []);

    const validateAmount = useCallback(async (amount: string) => {
        try {
            await invoke('validate_minotari_amount', { amount });
            return true;
        } catch (e) {
            console.log(e);
            const error = e as Error;
            setValidationErrorMessage(error.message);
            return false;
        }
    }, []);

    return { validateAddress, validateAmount, validationErrorMessage };
}
