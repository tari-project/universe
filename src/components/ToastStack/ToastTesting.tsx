/* eslint-disable i18next/no-literal-string */

import { addToast } from './useToastStore';
import { styled } from 'styled-components';

const TestingWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 5px;

    position: fixed;
    top: 10px;
    right: 10px;
    pointer-events: all;
    z-index: 999;
`;

const Button = styled.button`
    padding: 8px 16px;
    border-radius: 8px;
    background: #342945;
    color: white;
    border: none;
    cursor: pointer;

    font-size: 12px;

    &:hover {
        background: #221f3e;
    }
`;

export const ToastTesting = () => {
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
        <TestingWrapper>
            <Button onClick={showBasicToast}>Basic Toast</Button>
            <Button onClick={showErrorToast}>Error Toast</Button>
            <Button onClick={showWarningToast}>Warning Toast</Button>
            <Button onClick={showSuccessToast}>Success Toast</Button>
        </TestingWrapper>
    );
};
