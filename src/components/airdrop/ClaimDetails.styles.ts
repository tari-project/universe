import styled from 'styled-components';

export const ClaimContainer = styled.div`
    margin-top: 8px;
    width: 100%;
    border-radius: 15px;
    gap: 20px;
    padding: 30px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    backdrop-filter: blur(20px);
    background: linear-gradient(262deg, #333909 2.2%, #091d07 100.01%), #333909;

    box-shadow: 0 1px 18px 1px rgba(0, 0, 0, 0.2);
`;
export const EyebrowText = styled.div`
    color: #fff;
    font-size: 16px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: -0.48px;
`;
export const TrancheAmount = styled.div`
    color: #ffffff;
    line-height: 1;
    font-size: clamp(38px, 0.6rem + 2.5vw, 52px);
    font-weight: 600;
    letter-spacing: -1.56px;
    overflow-wrap: anywhere;
    span {
        color: rgba(255, 255, 255, 0.5);
        font-size: 28px;
        font-style: normal;
        font-weight: 600;
        letter-spacing: -0.84px;
    }
`;
export const ClaimItems = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: 8px;
`;
export const RemainingBalance = styled.div`
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(5px);
    border-radius: 10px;
    text-align: center;
    width: 100%;

    color: rgba(255, 255, 255, 0.5);
    font-size: 16px;
    font-weight: 400;
    line-height: 1.3;
    letter-spacing: -0.48px;

    span {
        font-weight: 600;
        color: #ffffff;
    }
`;
