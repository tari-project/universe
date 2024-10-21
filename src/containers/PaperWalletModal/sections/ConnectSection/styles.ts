import styled from 'styled-components';

export const Wrapper = styled('div')``;

export const HeroImage = styled('img')`
    position: absolute;
    top: -135px;
    left: 50%;
    transform: translateX(-50%);
    pointer-events: none;
`;

export const ContentWrapper = styled('div')`
    display: flex;
    flex-direction: column;
    gap: 25px;
    align-items: center;
    width: 100%;

    padding-top: 200px;
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
