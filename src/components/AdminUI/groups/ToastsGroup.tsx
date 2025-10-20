import { AdminButton, ButtonGroup } from '../styles';
import { addToast } from '@app/components/ToastStack/useToastStore';

export function ToastsGroup() {
    const showSuccessToast = () => {
        addToast({
            type: 'success',
            title: 'Success!',
            text: 'This is a success toast message',
        });
    };

    const showErrorToast = () => {
        addToast({
            type: 'error',
            title: 'Error!',
            text: 'This is an error toast message',
        });
    };

    const showWarningToast = () => {
        addToast({
            type: 'warning',
            title: 'Warning!',
            text: 'This is a warning toast message',
        });
    };

    const showInfoToast = () => {
        addToast({
            type: 'info',
            title: 'Info',
            text: 'This is an info toast message',
        });
    };

    const showDefaultToast = () => {
        addToast({
            title: 'Default Toast',
            text: 'This is a default toast message with a much longer description to test how the toast component handles longer text content. It should wrap properly and maintain good readability while showing multiple lines of text.',
        });
    };

    return (
        <>
            <ButtonGroup>
                <AdminButton onClick={showSuccessToast}>{`Success Toast`}</AdminButton>
                <AdminButton onClick={showErrorToast}>{`Error Toast`}</AdminButton>
                <AdminButton onClick={showWarningToast}>{`Warning Toast`}</AdminButton>
            </ButtonGroup>
            <ButtonGroup>
                <AdminButton onClick={showInfoToast}>{`Info Toast`}</AdminButton>
                <AdminButton onClick={showDefaultToast}>{`Default Toast`}</AdminButton>
            </ButtonGroup>
        </>
    );
}
