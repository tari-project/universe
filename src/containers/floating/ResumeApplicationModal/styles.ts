import styled from 'styled-components';

export const Wrapper = styled.div`
    display: flex;
    max-width: 480px;
    padding: 10px 20px;
    background: ${({ theme }) => theme.palette.background.paper};
    border-radius: 10px;
    border: 1px solid rgba(0, 0, 0, 0.05);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.18);
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    z-index: 10;
    position: fixed;
    top: 20px;
    right: 20px;
    margin: auto;
    gap: 16px;
`;

export const TextWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    max-width: 70%;
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
