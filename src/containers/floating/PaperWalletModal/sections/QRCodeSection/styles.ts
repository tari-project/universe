import styled from 'styled-components';

export const Wrapper = styled('div')`
    display: flex;
    flex-direction: column;
    gap: 40px;
`;

export const Divider = styled('div')`
    width: 100%;
    height: 1px;

    background: rgba(0, 0, 0, 0.15);
`;

export const CodeWrapper = styled('div')`
    display: flex;
    align-items: center;
    gap: 30px;
`;

export const ButtonWrapper = styled('div')`
    display: flex;
    flex-direction: column;
    gap: 20px;
`;

export const QRCodeWrapper = styled('div')`
    border-radius: 15px;
    background: white;
    padding: 10px;
    min-width: 200px;

    svg {
        display: block;
    }
`;

export const QRCodeImage = styled('img')`
    display: block;
    width: 150px;
`;

export const QRContentWrapper = styled('div')`
    display: flex;
    flex-direction: column;
`;

export const WarningText = styled('div')`
    color: #000;
    font-size: 10px;
    font-weight: 600;

    height: 23px;
    padding: 0px 12px 0px 10px;

    display: flex;
    justify-content: center;
    align-items: center;
    gap: 5px;
    align-self: flex-start;

    border-radius: 100px;
    background: rgba(255, 107, 107, 0.25);

    margin-bottom: 5px;
`;

export const Title = styled('div')`
    color: #000;
    font-size: 18px;
    font-weight: 600;
    line-height: 27px;
    letter-spacing: -0.4px;
    margin-bottom: 3px;
`;

export const Text = styled('div')`
    color: rgba(0, 0, 0, 0.75);
    font-size: 12px;
    font-weight: 500;
    line-height: 110%;
    margin-bottom: 20px;
`;

export const InputWrapper = styled('div')`
    position: relative;
    width: 100%;
    border-radius: 15px;
    background: rgba(0, 0, 0, 0.1);
`;

export const InputField = styled('input')`
    height: 69px;
    width: 100%;
    padding: 18px 18px 0 18px;

    color: #000;
    font-size: 18px;
    font-weight: 600;
    text-align: center;

    cursor: pointer;

    &::placeholder {
        color: rgba(0, 0, 0, 0.75);
    }
`;

export const InputLabel = styled('div')`
    color: rgba(0, 0, 0, 0.5);
    font-size: 12px;
    font-weight: 600;

    position: absolute;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
`;

export const VisibleToggle = styled('button')`
    position: absolute;
    top: 50%;
    right: 18px;
    width: 29px;
    height: 29px;

    transform: translateY(-50%);
    transition: transform 0.2s ease-in-out;

    &:hover {
        cursor: pointer;
        transform: translateY(-50%) scale(1.2);
    }
`;
