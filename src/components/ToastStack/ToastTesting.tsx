/* eslint-disable */

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
        addToast({ message: 'This is a basic toast' });
    };

    const showErrorToast = () => {
        addToast({ message: 'This is an error toast', type: 'error' });
    };

    const showWarningToast = () => {
        addToast({ message: 'This is a warning toast', type: 'warning' });
    };

    const showSuccessToast = () => {
        addToast({ message: 'This is a success toast', type: 'success' });
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
