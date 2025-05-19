import styled from 'styled-components';

export const Wrapper = styled('div')`
    position: relative;
`;

export const HeroImage = styled('img')`
    position: absolute;
    top: -140px;
    left: 50%;
    transform: translateX(-50%);
    pointer-events: none;
    width: 100%;
    @media (max-height: 800px) {
        width: 80%;
        top: -90px;
    }

    @media (max-height: 680px) {
        width: 70%;
        top: -70px;
    }
`;

export const ContentWrapper = styled('div')`
    display: flex;
    flex-direction: column;
    gap: 25px;
    align-items: center;
    width: 100%;

    padding: 200px 25px 0px 25px;

    @media (max-height: 680px) {
        padding-top: 170px;
        gap: 15px;
    }
`;

export const Title = styled('div')`
    color: #000;
    text-align: center;
    font-size: 30.8px;
    font-weight: 600;
    line-height: 99.7%;
    max-width: 463px;
`;

export const Text = styled('div')`
    color: rgba(0, 0, 0, 0.75);
    text-align: center;
    font-size: 16px;
    font-weight: 400;
    line-height: 122%;
    max-width: 505px;
`;

export const StoreWrapper = styled('div')`
    display: flex;
    align-items: center;
    gap: 20px;
`;
