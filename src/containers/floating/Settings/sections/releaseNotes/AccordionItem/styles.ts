import { m } from 'framer-motion';
import styled from 'styled-components';

export const Wrapper = styled.div`
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
`;

export const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 0;
    cursor: pointer;
    font-weight: 500;
`;

export const TextWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 5px;
`;

export const Title = styled.div`
    color: #000;
    font-size: 18px;
    font-weight: 600;
    line-height: 110%;
    margin: 0;
    padding: 0;
`;

export const Subtitle = styled.div`
    color: #797979;
    font-size: 12px;
    font-weight: 500;
    line-height: 116.667%;
`;

export const Content = styled(m.div)<{ $isOpen: boolean }>`
    overflow: hidden;
`;

export const ContentPadding = styled.div`
    padding: 0 0 10px 0;
`;

export const ChevronIcon = styled.span<{ $isOpen: boolean }>`
    border: solid #000;
    border-width: 0 2px 2px 0;
    display: inline-block;
    padding: 3px;
    transform: ${({ $isOpen }) => ($isOpen ? 'rotate(-135deg)' : 'rotate(45deg)')};
    transition: transform 0.3s ease;
`;
