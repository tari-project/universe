import styled, { css } from 'styled-components';
import { SendStatus } from '../Send';

export const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
`;

export const WhiteBox = styled.div`
    width: 100%;
    border-radius: 15px;
    background: #fff;
    padding: 15px;

    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
`;

export const WhiteBoxLabel = styled.div`
    font-size: 14px;
    font-style: normal;
    font-weight: 500;
    line-height: normal;
    letter-spacing: -0.42px;

    display: flex;
    align-items: center;
`;

export const WhiteBoxValue = styled.div`
    display: flex;
    align-items: center;
`;

export const Amount = styled.div`
    color: #090719;
    font-size: 30px;
    font-style: normal;
    font-weight: 600;
    line-height: 116.7%;
    letter-spacing: -1.606px;
    margin-left: 3px;
`;

export const Currency = styled.div`
    color: #000;
    font-size: 12px;
    font-style: normal;
    font-weight: 500;
    line-height: normal;
    letter-spacing: -0.36px;
    opacity: 0.5;
    margin-left: 5px;
`;

export const ListWrapper = styled.div`
    display: flex;
    flex-direction: column;
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
    color: #000;
    font-size: 12px;
    font-style: normal;
    font-weight: 500;
    line-height: normal;
    letter-spacing: -0.36px;
    opacity: 0.5;
`;

export const Value = styled.div<{ $status?: SendStatus }>`
    color: #090719;
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
    color: #000;
    font-size: 10px;
    font-style: normal;
    font-weight: 500;
    line-height: normal;
    letter-spacing: -0.3px;

    opacity: 0.5;
    margin-left: auto;
    text-align: right;
`;

export const StatusHero = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: center;
    justify-content: center;
    width: 100%;
`;

export const IconWrapper = styled.div`
    width: 50px;
    height: 50px;

    svg {
        width: 100%;
    }
`;

export const TextWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0px;
    align-items: center;
    justify-content: center;
`;

export const Title = styled.div`
    text-align: center;
    font-size: 18px;
    font-style: normal;
    font-weight: 600;
    line-height: 172.222%;
`;

export const Text = styled.div`
    color: rgba(9, 7, 25, 0.7);
    text-align: center;
    font-size: 12px;
    font-style: normal;
    font-weight: 400;
    line-height: 116.7%;
`;
