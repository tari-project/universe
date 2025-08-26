import styled from 'styled-components';

export const Wrapper = styled.div`
    position: relative;
    z-index: 1;
    font-family: Poppins, sans-serif;

    display: flex;
    flex-direction: column;
    gap: 14px;
    padding-bottom: 20px;
`;

export const CoinsBg = styled.img`
    position: absolute;
    top: 0px;
    left: 0px;

    border-radius: 13px 0px 0px 0px;
`;

export const CoinsBg2 = styled.img`
    position: absolute;
    top: 40px;
    right: 0px;
`;

export const Title = styled.div`
    color: #fff;
    font-size: 20px;
    font-weight: 400;
    line-height: 103.6%;
    max-width: 200px;
`;

export const Text = styled.div`
    color: #fff;
    font-size: 12px;
    font-weight: 400;
    line-height: 116.667%;
    max-width: 300px;
`;

export const BonusText = styled.div`
    color: #fff;
    font-size: 10px;
    font-weight: 400;
    line-height: 14px;

    border-radius: 40px;
    border: 1px solid #4a4a4a;

    padding: 0px 12px;
    height: 27px;

    display: flex;
    align-items: center;
    justify-content: center;
`;

export const LoginButton = styled.button`
    color: #000;
    text-align: center;
    font-size: 13px;
    font-weight: 600;
    line-height: normal;
    letter-spacing: -0.39px;

    border-radius: 72px;
    background: #fff;

    width: 100%;
    height: 42px;
    flex-shrink: 0;

    display: flex;
    align-items: center;
    justify-content: center;

    span {
        transition: transform 0.2s ease-in-out;
        display: inline-block;
    }

    &:hover {
        span {
            transform: scale(1.05);
        }
    }
`;

export const MinimizePosition = styled.div`
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 2;
`;
