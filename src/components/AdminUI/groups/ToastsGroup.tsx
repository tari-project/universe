/* eslint-disable i18next/no-literal-string */
import { Button, ButtonGroup, CategoryLabel } from '../styles';
import { addToast } from '@app/components/ToastStack/useToastStore';

export function ToastsGroup() {
    const showBasicToast = () => {
        addToast({
            title: 'Changes saved',
            text: 'All your changes have been saved to the cloud',
        });
    };

    const showErrorToast = () => {
        addToast({
            title: 'Connection failed',
            text: 'Please check your internet connection and try again',
            type: 'error',
        });
    };

    const showWarningToast = () => {
        addToast({
            title: 'Session expiring soon',
            text: 'Your session will expire in 5 minutes. Please save your work.',
            type: 'warning',
        });
    };

    const showSuccessToast = () => {
        addToast({
            title: 'Profile updated',
            text: 'Your changes have been synced across all devices',
            type: 'success',
        });
    };

    return (
        <>
            <CategoryLabel>Toasts</CategoryLabel>
            <ButtonGroup>
                <Button onClick={showBasicToast}>Basic Toast</Button>
                <Button onClick={showErrorToast}>Error Toast</Button>
                <Button onClick={showWarningToast}>Warning Toast</Button>
                <Button onClick={showSuccessToast}>Success Toast</Button>
            </ButtonGroup>
        </>
    );
}
