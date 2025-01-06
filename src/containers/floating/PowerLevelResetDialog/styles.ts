import styled from 'styled-components';

export const Wrapper = styled.div`
    max-width: 596px;
    width: 100%;
    padding: 10px;

    display: flex;
    flex-direction: column;
    gap: 25px;
`;

export const TextWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
`;

export const Title = styled.div`
    color: #000;
    font-size: 18px;
    font-weight: 600;
    line-height: 150%;
    letter-spacing: -0.4px;
`;

export const Text = styled.div`
    color: #797979;
    font-size: 13px;
    font-weight: 500;
    line-height: 130.769%;
`;

export const ButtonWrapper = styled.div`
    display: flex;
    align-items: center;
    width: 100%;
    gap: 10px;
`;

export const KeepButton = styled.button`
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;

    padding: 0px 25px;

    width: 100%;
    height: 38px;

    border-radius: 20px;
    background: #000;
    border: 1px solid #000;

    color: #fff;
    text-align: center;
    font-size: 12px;
    font-weight: 500;
    line-height: 110%;

    span {
        position: absolute;
        left: 10px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 16px;
    }

    transition: transform 0.2s ease-in-out;

    &:hover {
        transform: scale(1.025);
    }
`;

export const RevertButton = styled.button`
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;

    padding: 0px 25px;

    width: 100%;
    height: 38px;

    border-radius: 20px;
    border: 1px solid #000;

    color: #000;
    text-align: center;
    font-size: 12px;
    font-weight: 500;
    line-height: 110%;

    transition: transform 0.2s ease-in-out;

    &:hover {
        transform: scale(1.025);
    }
`;

export const CountdownNumber = styled.span`
    color: #000;
    font-weight: 700;
    width: 17px;
    display: inline-block;
    text-align: center;
    font-variant-numeric: tabular-nums;
`;
