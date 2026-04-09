import styled from 'styled-components';

export const SeedImportSection = styled.div`
    padding: 20px;
    max-width: 500px;
    margin: 20px auto;
    border: 1px solid ${({ theme }) => theme.palette.divider ?? '#e0e0e0'};
    border-radius: 8px;
    background-color: ${({ theme }) => theme.palette.background.paper ?? '#ffffff'};
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
    font-family: ${({ theme }) => theme.typography?.fontFamily ?? 'sans-serif'};
    color: ${({ theme }) => theme.palette.text.primary ?? '#333'};
`;

export const SeedImportTitle = styled.h3`
    color: ${({ theme }) => theme.palette.text.primary ?? '#2c3e50'};
    margin-top: 0;
    margin-bottom: 15px;
`;

export const SeedImportDescription = styled.p`
    font-size: 0.95em;
    line-height: 1.5;
    margin-bottom: 20px;
    color: ${({ theme }) => theme.palette.text.secondary ?? '#555'};
`;

export const SeedInputContainer = styled.div<{ $status?: 'error' | 'success' | '' }>`
    position: relative;
    margin-bottom: 15px;

    textarea {
        width: 100%;
        padding: 12px;
        border: 1px solid
            ${({ $status, theme }) =>
                $status === 'error'
                    ? theme.palette.error?.main ?? '#dc3545'
                    : $status === 'success'
                      ? theme.palette.success?.main ?? '#28a745'
                      : '#ddd'};
        border-radius: 6px;
        font-size: 1em;
        box-sizing: border-box;
        resize: vertical;
        min-height: 120px;
        transition: border-color 0.2s ease-in-out;

        &:focus {
            outline: none;
            border-color: ${({ theme }) => theme.palette.primary?.main ?? '#007bff'};
            box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
        }
    }
`;

export const ConfirmationTick = styled.span`
    position: absolute;
    right: 15px;
    top: 15px;
    color: ${({ theme }) => theme.palette.success?.main ?? '#28a745'};
    font-size: 1.6em;
    pointer-events: none;
    background-color: ${({ theme }) => theme.palette.background.paper ?? '#ffffff'};
    border-radius: 50%;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

export const ErrorMessage = styled.p`
    color: ${({ theme }) => theme.palette.error?.main ?? '#dc3545'};
    font-size: 0.9em;
    margin-top: -5px;
    margin-bottom: 10px;
    padding-left: 5px;
`;

export const ConfirmButton = styled.button`
    width: 100%;
    padding: 12px 20px;
    background-color: ${({ theme }) => theme.palette.primary?.main ?? '#007bff'};
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1.1em;
    font-weight: bold;
    transition:
        background-color 0.2s ease-in-out,
        opacity 0.2s ease-in-out;

    &:hover:not(:disabled) {
        background-color: ${({ theme }) => theme.palette.primary?.dark ?? '#0056b3'};
    }

    &:disabled {
        background-color: #cccccc;
        cursor: not-allowed;
        opacity: 0.7;
    }
`;
