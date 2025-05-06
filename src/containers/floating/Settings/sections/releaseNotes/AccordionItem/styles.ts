import * as m from 'motion/react-m';
import styled, { css } from 'styled-components';

export const Wrapper = styled.div`
    border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
`;

export const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 0;
    cursor: pointer;
    font-weight: 500;
    gap: 10px;
`;

export const TextWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 5px;
`;

export const Title = styled.div`
    font-size: 18px;
    font-weight: 600;
    line-height: 110%;
    margin: 0;
    padding: 0;
`;

export const Subtitle = styled.div`
    color: ${({ theme }) => theme.palette.text.secondary};
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

export const ChevronIcon = styled.svg<{ $isOpen: boolean }>`
    width: 22px;
    height: 22px;
    transform: scaleY(1);
    transition: transform 0.3s ease;
    flex-shrink: 0;

    ${({ $isOpen }) =>
        $isOpen &&
        css`
            transform: scaleY(-1);
        `}
`;
