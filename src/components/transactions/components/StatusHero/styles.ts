import styled from 'styled-components';

export const Wrapper = styled.div`
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
    text-align: center;
    font-size: 12px;
    font-style: normal;
    font-weight: 400;
    line-height: 116.7%;
`;
