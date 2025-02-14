import styled from 'styled-components';

export const LogoWrapper = styled('div')`
    color: ${({ theme }) => theme.palette.text.primary};

    display: flex;
    align-items: center;
    gap: 7px;
    padding-left: 4px;

    svg {
        width: 24px;
        transform: translateY(1px);
    }
`;

export const LogoText = styled('div')`
    font-family: DrukWide, sans-serif;
    font-size: 16px;
    font-style: normal;
    font-weight: 800;
    line-height: 110%;
    text-transform: uppercase;
    user-select: none;
`;
