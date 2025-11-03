import styled from 'styled-components';

export const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    width: 500px;
    padding: 20px;
    gap: 0;
`;

export const IconWrapper = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 20px;
`;

export const BatteryIcon = styled.div`
    font-size: 64px;
    filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15));
    animation: pulse 2s ease-in-out infinite;

    @keyframes pulse {
        0%,
        100% {
            transform: scale(1);
            opacity: 1;
        }
        50% {
            transform: scale(1.05);
            opacity: 0.9;
        }
    }
`;

export const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
`;

export const Title = styled.div`
    color: ${({ theme }) => theme.palette.text.primary};
    font-size: 24px;
    font-style: normal;
    font-weight: 700;
    line-height: 130%;
    letter-spacing: -0.4px;
    text-align: center;
`;

export const Description = styled.div`
    color: ${({ theme }) => theme.palette.text.secondary};
    font-size: 15px;
    font-weight: 500;
    line-height: 150%;
    letter-spacing: -0.2px;
    text-align: center;
    padding: 0 10px;
`;

export const InfoBox = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 18px 20px;
    border-radius: 12px;
    background: linear-gradient(
        135deg,
        ${({ theme }) => theme.palette.success.wisp} 0%,
        ${({ theme }) => theme.palette.success.wisp}80 100%
    );
    box-shadow: inset 0 0 0 1px ${({ theme }) => theme.palette.success.main}25;
    margin: 10px 0;
    position: relative;
    overflow: hidden;

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 4px;
        height: 100%;
        background: ${({ theme }) => theme.palette.success.main};
    }
`;

export const InfoIcon = styled.div`
    font-size: 24px;
    line-height: 1;
    flex-shrink: 0;
`;

export const InfoLabel = styled.div`
    color: ${({ theme }) => theme.palette.text.primary};
    font-size: 14px;
    font-weight: 600;
    line-height: 150%;
    letter-spacing: -0.1px;
    flex: 1;
`;

export const ActionButton = styled.button`
    border-radius: 49px;
    background: linear-gradient(90deg, #059669 0%, #047857 100%);
    box-shadow: 0 4px 20px rgba(5, 150, 105, 0.2);

    height: 51px;
    width: 100%;

    color: #ffffff;
    text-align: center;
    font-family: inherit;
    font-size: 15px;
    font-style: normal;
    font-weight: 700;
    line-height: 99.7%;
    text-transform: uppercase;
    cursor: pointer;

    transition: all 0.2s ease;

    span {
        display: block;
        transition: transform 0.2s ease;
    }

    &:hover {
        background: linear-gradient(90deg, #059669 0%, #047857 100%);
        box-shadow: 0 6px 24px rgba(5, 150, 105, 0.3);
        filter: brightness(1.05);
    }

    &:active {
        transform: scale(0.98);
    }
`;
