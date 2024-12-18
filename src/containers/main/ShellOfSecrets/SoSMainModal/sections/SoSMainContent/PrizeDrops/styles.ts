import styled from 'styled-components';
import backgroundImage from './images/background.png';

export const Wrapper = styled('div')`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
`;

export const DropWrapper = styled('div')`
    width: 100%;
    background-color: #171d15;
    position: relative;

    padding: 35px 25px 18px 25px;

    display: flex;
    flex-direction: column;
    gap: 20px;

    background-image: url(${backgroundImage});
    background-size: cover;
    background-position: right;
`;

export const Eyebrow = styled('div')`
    background: #e6ff47;

    width: 150px;
    height: 24px;
    padding: 0px 10px;

    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;

    position: absolute;
    top: -12px;

    color: #000;
    font-family: 'Poppins', sans-serif;
    font-size: 10px;
    font-style: normal;
    font-weight: 700;
    line-height: 100%; /* 10.104px */
    letter-spacing: -0.202px;
`;

export const TextGroup = styled('div')`
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-right: 100px;
    flex-grow: 1;
`;

export const Title = styled('div')`
    color: #e6ff47;
    font-size: 28px;
    font-weight: 700;
    line-height: 105.333%;
    letter-spacing: -0.924px;
    max-width: 345px;
`;

export const Text = styled('div')`
    color: #cfe640;
    font-size: 13px;
    font-style: normal;
    font-weight: 500;
    line-height: 139.451%;
    letter-spacing: -0.924px;
    text-transform: uppercase;
    max-width: 345px;
`;

export const MacbookImage = styled('img')`
    position: absolute;
    top: -20px;
    right: -20px;
`;

export const RuneImage = styled('img')`
    position: absolute;
    top: -20px;
    right: 10px;
`;
