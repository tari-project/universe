import styled, { css } from 'styled-components';
import { SendStatus } from '../../send/SendModal';

export const Wrapper = styled('div')`
    display: flex;
    flex-direction: column;
    gap: 10px;
`;

export const Entry = styled.div`
    display: flex;
    flex-direction: column;
    gap: 3px;

    padding: 15px 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);

    &:first-child {
        padding-top: 0;
    }
`;

export const Label = styled.div`
    color: ${({ theme }) => theme.palette.text.primary};
    font-size: 12px;
    font-style: normal;
    font-weight: 500;
    line-height: normal;
    letter-spacing: -0.36px;
    opacity: 0.5;
`;

export const Value = styled.div<{ $status?: SendStatus }>`
    font-size: 14px;
    font-style: normal;
    font-weight: 500;
    line-height: 116.7%;
    letter-spacing: -0.42px;

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

    ${({ $status }) =>
        $status === 'completed' &&
        css`
            color: #36c475;
        `}
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
