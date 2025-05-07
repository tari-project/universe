import styled from 'styled-components';

export const HeaderWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 15px;
    padding: 0 40px;

    h3 {
        font-family: Poppins;
        font-weight: 600;
        font-size: 21px;
        line-height: 31px;
        letter-spacing: 0%;
        text-align: center;
        color: black;
        max-width: 300px;
        margin: 0;
    }

    p {
        font-family: Poppins;
        font-weight: 400;
        font-size: 12px;
        line-height: 117%;
        letter-spacing: 0px;
        text-align: center;
        color: #000000;
        opacity: 0.7;
    }
`;

export const ProcessingItemDetailWrapper = styled.div`
    border-bottom: 2px solid #0000001a;
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 15px 0;
`;

export const ProcessingItemDetailKey = styled.div`
    color: rgba(0, 0, 0, 0.6);
    font-family: Poppins;
    font-weight: 500;
    font-size: 11px;
    line-height: 130%;
    letter-spacing: -2%;
    display: flex;
    align-items: center;
    gap: 8px;
`;

export const StatusValue = styled.div<{ $status: 'processing' | 'success' | 'error' }>`
    font-family: Poppins;
    font-weight: bold;
    font-size: 14px;
    line-height: 117%;
    letter-spacing: -3%;
    color: ${({ $status: status, theme }) => {
        switch (status) {
            case 'processing':
                return '#FF7700';
            case 'success':
                return theme.mode === 'dark' ? '#00ff00' : '#36C475';
            case 'error':
                return '#ff0000';
            default:
                return '#000000';
        }
    }};
`;

export const ProcessingDetailsWrapper = styled.div`
    padding: 20px;
`;

export const ProcessingItemDetailValue = styled.div`
    color: black;
    font-family: Poppins;
    font-weight: 500;
    font-size: 14px;
    line-height: 117%;
    letter-spacing: -3%;
    display: flex;
    justify-content: space-between;
    > span {
        font-family: Poppins;
        font-weight: 500;
        font-size: 10px;
        line-height: 100%;
        letter-spacing: -3%;
    }
`;

export const LoadingDots = styled.span`
    color: currentColor;
    display: inline-block;
    width: 24px;
    height: 15px;
    text-align: left;
    position: relative;

    span {
        position: absolute;
        opacity: 0.3;
        font-size: 35px;
        line-height: 0;
        animation: dotFade 1.5s infinite;

        &:nth-child(1) {
            left: 0;
        }
        &:nth-child(2) {
            left: 8px;
            animation-delay: 0.5s;
        }
        &:nth-child(3) {
            left: 16px;
            animation-delay: 1s;
        }
    }

    @keyframes dotFade {
        0%,
        100% {
            opacity: 0.3;
        }
        50% {
            opacity: 1;
        }
    }
`;
