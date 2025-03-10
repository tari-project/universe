import styled from 'styled-components';

export const BannerContent = styled.div`
    position: fixed;
    top: 20px;
    right: 30px;
    z-index: 99999;
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: white;
    padding: 0.3rem 0.3rem;
    border-radius: 9999px;
    max-width: 30rem;
    background-color: #000;
    color: #fff;
`;

export const TextSection = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
`;

export const IconContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: white;
    border-radius: 9999px;
    padding: 0.5rem;
    font-size: 0.875rem;
    width: 1 rem;
    height: 1 rem;
`;

export const Title = styled.span`
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
    font-size: 0.875rem;
`;

export const LiveBadgeWrapper = styled.div`
    display: flex;
    justify-content: space-evenly;
    align-items: center;
    background-color: #ef4444;
    padding: 4px 12px;
    border-radius: 9999px;
    font-size: 0.875rem;
    gap: 12px;
`;

export const LiveBadgeText = styled.div`
    color: white;
    font-weight: 700;
`;

export const LiveBadgePoint = styled.div`
    background-color: white;
    border-radius: 9999px;
    width: 0.725rem;
    height: 0.725rem;
`;

export const TimeBadge = styled.div`
    background-color: white;
    color: black;
    font-weight: 1000;
    padding: 4px 12px;
    border-radius: 9999px;
    font-size: 0.875rem;
    gap: 12px;
`;
