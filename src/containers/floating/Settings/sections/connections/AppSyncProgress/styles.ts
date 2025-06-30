import styled from 'styled-components';

export const Wrapper = styled.div`
    display: flex;
    max-width: 100%;
    padding: 10px 20px;
    background: ${({ theme }) => theme.palette.background.paper};
    border-radius: 10px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
`;

export const TextWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    max-width: 80%;
`;

export const ProgressWrapper = styled.div`
    display: flex;
    gap: 10px;
    flex-direction: row;
    align-items: center;
`;

export const Title = styled.span`
    font-size: 14px;
    font-style: normal;
    font-weight: 600;
    line-height: 150%;
    letter-spacing: -0.4px;
`;

export const Text = styled.span`
    font-size: 12px;
    font-style: normal;
    font-weight: 400;
    line-height: 150%;
    letter-spacing: -0.4px;
`;
