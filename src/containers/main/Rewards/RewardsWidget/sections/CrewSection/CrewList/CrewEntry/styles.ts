import styled from 'styled-components';

export const Wrapper = styled.div`
    display: flex;
    align-items: center;
    align-self: stretch;
    gap: 20px;

    height: 70px;
    padding: 12px;

    border-radius: 15px;
    border: 1px solid rgba(227, 227, 227, 0.03);
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.04) 100%);
`;

export const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 7px;
`;

export const TopRow = styled.div``;

export const Handle = styled.div`
    color: #fff;
    font-family: Poppins, sans-serif;
    font-size: 16px;
    font-style: normal;
    font-weight: 500;
    line-height: 112.804%;
    letter-spacing: -0.924px;
`;

export const Progress = styled.div``;

export const ProgressPercent = styled.div``;

export const ProgressBar = styled.div``;
