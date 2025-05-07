import { useTheme } from 'styled-components';

export const SuccessIcon = ({ width }: { width?: string }) => {
    const theme = useTheme();
    const fill = theme.mode === 'dark' ? '#00ff00' : '#17CB9B';

    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={width} fill="none" viewBox="0 0 49 50">
            <path
                fill={fill}
                fillRule="evenodd"
                d="M24.5 49.5C10.969 49.5 0 38.531 0 25S10.969.5 24.5.5 49 11.469 49 25 38.031 49.5 24.5 49.5Zm10.21-30.477a2.28 2.28 0 0 0-2.187-3.999c-4.168 2.28-7.614 6.678-9.93 10.226a60.086 60.086 0 0 0-2.174 3.604c-.546-.53-1.087-.99-1.57-1.372-.633-.5-1.203-.895-1.618-1.166l-.718-.447a2.279 2.279 0 0 0-2.259 3.96l.48.3c.325.212.781.528 1.288.929 1.043.824 2.168 1.905 2.876 3.089a2.28 2.28 0 0 0 4.029-.222l.224-.468c.154-.316.385-.777.686-1.345a56.121 56.121 0 0 1 2.572-4.37c2.24-3.431 5.176-7.01 8.301-8.719Z"
                clipRule="evenodd"
            />
        </svg>
    );
};
