import styled from 'styled-components';

export const AvatarWrapper = styled.div<{ $image: string; $size: number }>`
    width: ${({ $size }) => $size}px;
    height: ${({ $size }) => $size}px;
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

    font-size: ${({ $size }) => $size / 2}px;
    font-weight: 600;
    color: #fff;
`;
