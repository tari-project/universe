import styled from 'styled-components';

export const Wrapper = styled('div')`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
`;

export const FriendsWrapper = styled('div')`
    display: flex;
    padding-left: 10px;
`;

export const Friend = styled('img')<{ $image: string }>`
    width: 33px;
    height: 33px;
    border-radius: 100px;
    border: 1px solid #fff;
    background: #d9d9d9;

    background-image: url(${(props) => props.$image});
    background-size: cover;
    background-position: center;

    margin-left: -10px;
`;

export const FriendCount = styled('div')`
    width: 33px;
    height: 33px;
    border-radius: 100px;
    border: 1px solid #fff;
    background: #d9d9d9;

    color: #050824;
    text-align: center;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: -0.5px;

    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: -10px;
`;

export const Text = styled('div')`
    color: #fff;
    text-align: center;
    font-family: 'IBM Plex Mono', sans-serif;
    font-size: 14px;
    font-weight: 700;
    line-height: 129.623%;
    text-transform: uppercase;
    max-width: 164px;
`;

export const PositionArrows = styled('div')`
    position: absolute;
    top: -20px;
    right: 12px;
`;
