import styled from 'styled-components';

export const AvatarWrapper = styled.div<{ $image: string }>`
    width: 36px;
    height: 36px;
    border-radius: 100%;
    flex-shrink: 0;

    background-image: ${({ $image }) => $image};
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    background-color: ${({ theme }) => theme.palette.contrastAlpha};

    display: flex;
    align-items: center;
    justify-content: center;

    font-size: 16px;
    font-weight: 600;
    color: #fff;
    cursor: default;
`;
