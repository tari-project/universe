import styled, { css } from 'styled-components';
import { SendStatus } from '../../send/SendModal';

export const Wrapper = styled('div')`
    display: flex;
    flex-direction: column;
    width: 100%;
`;

export const Entry = styled.div`
    display: flex;
    flex-direction: column;
    gap: max(3px, 0.2vh);
    padding: max(6px, 0.8vh) 0;
    border-bottom: ${({ theme }) => `1px solid ${theme.colorsAlpha.greyscaleAlpha[20]}`};

    &:first-child {
        padding-top: 0;
    }
    &:last-child {
        border-bottom: none;
    }
`;

export const Label = styled.div`
    color: ${({ theme }) => theme.palette.text.primary};
    font-size: 11px;
    text-transform: capitalize;
    font-weight: 500;
    line-height: 1;
    letter-spacing: -0.36px;
    opacity: 0.5;
`;

export const Value = styled.div<{ $status?: SendStatus }>`
    font-size: clamp(13px, calc(0.8rem + 0.1vw), 16px);
    font-style: normal;
    font-weight: 500;
    line-height: 1.22;
    letter-spacing: -0.3px;

    display: flex;
    align-items: center;
    justify-content: space-between;

    white-space: pre-wrap;
    overflow-wrap: break-word;
    word-break: break-word;
    word-wrap: break-word;
    overflow: hidden;
    text-overflow: ellipsis;

    ${({ $status }) =>
        $status === 'processing' &&
        css`
            color: #ff7700;
        `}

    ${({ theme, $status }) =>
        $status === 'completed' &&
        css`
            color: ${theme.mode === 'dark' ? '#17cb9b' : '#168552'};
        `}
`;

export const ValueLeft = styled.div`
    display: flex;
    align-items: baseline;
    span {
        line-height: 1;
        font-size: 10px;
        vertical-align: bottom;
        display: flex;
    }
`;

export const ValueRight = styled.div`
    font-size: 10px;
    font-style: normal;
    font-weight: 500;
    line-height: normal;
    letter-spacing: -0.3px;

    opacity: 0.5;
    margin-left: auto;
    text-align: right;
`;

export const ExternalLink = styled.a`
    color: inherit;
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
`;
