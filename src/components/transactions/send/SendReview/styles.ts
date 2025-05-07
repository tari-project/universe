import styled from 'styled-components';

export const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
`;

export const WhiteBox = styled.div`
    width: 100%;
    border-radius: 15px;
    background-color: ${({ theme }) => theme.palette.background.default};
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
    font-size: 30px;
    font-style: normal;
    font-weight: 600;
    line-height: 116.7%;
    letter-spacing: -1.606px;
    margin-left: 3px;
`;

export const Currency = styled.div`
    font-size: 12px;
    font-style: normal;
    font-weight: 500;
    line-height: normal;
    letter-spacing: -0.36px;
    opacity: 0.5;
    margin-left: 5px;
`;
