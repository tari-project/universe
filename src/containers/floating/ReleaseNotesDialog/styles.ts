import styled from 'styled-components';

export const Wrapper = styled.div`
    width: 500px;
    padding: 0 15px;
`;

export const Title = styled.div`
    color: #000;
    font-size: 22px;
    font-style: normal;
    font-weight: 600;
    line-height: 150%;
    letter-spacing: -0.4px;

    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    padding-bottom: 10px;
    margin-bottom: 5px;
`;

export const ButtonWrapper = styled.div`
    border-top: 1px solid rgba(0, 0, 0, 0.05);
    padding-top: 20px;
    margin-top: 5px;
`;

export const Button = styled.button`
    border-radius: 49px;
    background: #000;
    box-shadow: 28px 28px 77px 0px rgba(0, 0, 0, 0.1);

    height: 51px;
    width: 100%;

    color: #c9eb00;
    text-align: center;
    font-family: DrukWide, sans-serif;
    font-size: 15px;
    font-style: normal;
    font-weight: 800;
    line-height: 99.7%;
    text-transform: uppercase;

    span {
        display: block;
        transition: transform 0.2s ease;
    }

    &:hover {
        span {
            transform: scale(1.075);
        }
    }
`;
