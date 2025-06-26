import { invoke } from '@tauri-apps/api/core';
import { useCallback, useState } from 'react';

export function useValidate() {
    const [validationError, setValidationError] = useState<string | undefined>();
    const validateAddress = useCallback(async (address: string) => {
        try {
            await invoke('verify_address_for_send', { address });
            return true;
        } catch (e) {
            const error = e as Error;
            setValidationError(error.message);
            return false;
        }
    }, []);

    return { validateAddress, validationError };
}
