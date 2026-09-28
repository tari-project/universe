import { useFormContext } from 'react-hook-form';
import { ErrorText } from '@app/components/transactions/components/TxInput.style.ts';

// The send-style modals set `root.invoke_error` when the backend refuses the transaction
// (PIN cancelled, timeout, failure). react-hook-form clears root errors on the next submit.
export function FormRootError() {
    const { formState } = useFormContext();
    const message = formState.errors.root?.invoke_error?.message;
    if (!message) return null;
    return (
        <ErrorText style={{ width: 'auto' }} data-testid="form-root-error">
            {message}
        </ErrorText>
    );
}
