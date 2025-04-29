import styled from 'styled-components';

export const DashboardBanner = styled.div`
    width: 100%;
    height: 76px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: ${({ theme }) => theme.palette.contrast};
    border-radius: 15px;
    padding: 0 20px;
    pointer-events: auto;

    span {
        color: #fff;
        font-family: DrukWide, sans-serif;
        font-size: 17px;
        font-style: italic;
        font-weight: 700;
        line-height: 94.2%; /* 16.014px */
        text-transform: uppercase;
    }
`;
