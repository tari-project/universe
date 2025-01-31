import { m } from 'motion';
import styled from 'styled-components';

export const Wrapper = styled('div')``;

export const HeroImage = styled('img')`
    position: absolute;
    top: -66px;
    left: 50%;
    transform: translateX(-50%);
    pointer-events: none;

    @media (max-height: 800px) {
        width: 65%;
        top: -50px;
    }
`;

export const ContentWrapper = styled('div')`
    padding-top: 310px;

    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 20px;

    @media (max-height: 800px) {
        padding-top: 190px;
    }
`;

export const Title = styled('div')`
    color: #000;
    text-align: center;
    font-family: DrukWide, sans-serif;
    font-weight: 800;
    font-size: 30px;
    line-height: 99.7%;
    text-transform: uppercase;
    max-width: 276px;
`;

export const WinnerPill = styled('div')`
    color: rgba(0, 0, 0, 0.5);
    font-size: 16px;
    font-style: normal;
    font-weight: 600;
    line-height: normal;
    border-radius: 131px;
    background: rgba(0, 0, 0, 0.1);

    padding: 0px 12px;
    height: 28px;

    display: flex;
    align-items: center;
    justify-content: center;
`;

export const BlackButton = styled('button')`
    border-radius: 49px;
    background: #000;
    box-shadow: 28px 28px 77px 0px rgba(0, 0, 0, 0.1);

    width: 100%;
    height: 81px;

    color: #c9eb00;
    text-align: center;
    font-family: DrukWide, sans-serif;
    font-weight: 800;
    font-size: 21px;
    font-style: normal;
    line-height: 99.7%;
    text-transform: uppercase;
    cursor: pointer;

    overflow: hidden;
    position: relative;

    transition: transform 0.2s ease;

    &:hover {
        transform: scale(1.05);
    }
`;

export const Copied = styled(m.div)`
    position: absolute;
    inset: 0;
    z-index: 1;

    background-color: #c9eb00;
    color: #000;

    display: flex;
    align-items: center;
    justify-content: center;
`;

export const Text = styled('div')`
    color: #000;
    text-align: center;
    font-size: 16.8px;
    font-weight: 500;
    line-height: 99.7%;
    text-transform: uppercase;

    strong {
        font-weight: 700;
    }
`;

export const RewardWrapper = styled('div')`
    padding: px 30px;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 11px;

    border-radius: 20px;
    background: #f1f1f1;
    width: 100%;
    height: 78px;
`;

export const Label = styled('div')`
    color: #000;
    text-align: center;
    font-size: 14px;
    font-style: normal;
    font-weight: 700;
    line-height: 50%;
    text-transform: uppercase;
`;

export const Value = styled('div')`
    color: #000;
    font-family: DrukWide, sans-serif;
    font-weight: 800;
    font-size: 12px;
    font-style: normal;
    line-height: 50%;
    text-transform: uppercase;
`;

export const Number = styled('span')`
    font-size: 25px;
    font-weight: 800;
    line-height: 60%;
`;

export const GemPill = styled('div')`
    display: flex;
    height: 32px;
    padding: 7px 11px 7px 15px;
    justify-content: center;
    align-items: center;
    gap: 2px;

    border-radius: 100px;
    background: ${({ theme }) => theme.palette.action.background.contrast};
    color: ${({ theme }) => theme.palette.contrast};

    position: absolute;
    top: 50%;
    right: 20px;
    transform: translateY(-50%);

    color: #000;
    font-size: 17px;
    font-weight: 600;
    font-family: Poppins, sans-serif;
    text-align: center;
    pointer-events: none;
`;

export const GemImage = styled('img')`
    width: 20px;
`;
