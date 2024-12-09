import styled, { css } from 'styled-components';

export const Wrapper = styled('div')<{ $current?: boolean }>`
    display: flex;
    align-items: center;

    padding: 13px;

    border-radius: 9px;
    border: 2px solid #2d2d2d;
    background: rgba(255, 255, 255, 0.05);
    box-shadow: 0px 3.625px 12.686px 0px rgba(0, 0, 0, 0.1);

    ${({ $current }) =>
        $current &&
        css`
            border: 2px solid #85892a;
            background: #364031;
            box-shadow: 0px 3.698px 40.677px 0px rgba(0, 0, 0, 0.5);
        `}
`;

export const Avatar = styled('div')<{ $image: string; $current?: boolean }>`
    width: 27px;
    height: 27px;
    border-radius: 100%;
    background-color: rgba(255, 255, 255, 0.2);

    background-image: url(${(props) => props.$image});
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;

    position: relative;

    ${({ $current }) =>
        $current &&
        css`
            width: 45px;
            height: 45px;
        `}
`;

export const Rank = styled('div')<{ $current?: boolean }>`
    width: 15px;
    height: 15px;
    background-color: #e6ff47;
    border-radius: 100%;

    position: absolute;
    top: -4px;
    left: -4px;

    display: flex;
    justify-content: center;
    align-items: center;

    color: #000;
    font-family: 'Poppins', sans-serif;
    font-size: 8px;
    font-style: normal;
    font-weight: 600;
    line-height: 100%;
    letter-spacing: 0.254px;

    ${({ $current }) =>
        $current &&
        css`
            width: 26px;
            height: 26px;
            font-size: 13px;
            top: -6px;
            left: -8px;
        `}
`;

export const Handle = styled('span')<{ $current?: boolean }>`
    color: #fff;
    font-family: 'Poppins', sans-serif;
    font-size: 13px;
    font-style: normal;
    font-weight: 600;
    line-height: 100%;
    letter-spacing: 0.254px;

    ${({ $current }) =>
        $current &&
        css`
            font-size: 21.179px;
        `}
`;

export const LeftSide = styled('div')`
    display: flex;
    align-items: center;
    flex-grow: 1;
    gap: 10px;
`;

export const RightSide = styled('div')`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 30px;
`;

export const Dot = styled('div')<{ $isRed?: string }>`
    width: 9px;
    height: 9px;
    border-radius: 100%;
    background-color: #e6ff47;

    ${({ $isRed }) =>
        $isRed &&
        css`
            background-color: #e2855d;
        `}
`;

export const Status = styled('div')<{ $isRed?: string }>`
    color: #e6ff47;
    font-size: 13px;
    font-style: normal;
    font-weight: 700;
    line-height: 139.451%;
    letter-spacing: -0.924px;
    text-transform: uppercase;

    display: flex;
    align-items: center;
    gap: 5px;

    ${({ $isRed }) =>
        $isRed &&
        css`
            color: #e2855d;
        `}
`;

export const Duration = styled('div')`
    color: #e6ff47;
    text-align: center;
    font-size: 10px;
    font-style: normal;
    font-weight: 600;
    line-height: 100%;
    letter-spacing: 0.203px;

    padding: 6px 9px;
    background: #000;
`;
