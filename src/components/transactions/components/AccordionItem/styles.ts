/* eslint-disable prettier/prettier */
import * as m from 'motion/react-m';
import styled, { css } from 'styled-components';

export const Wrapper = styled.div`
    border: 1px solid ${({ theme }) => theme.colorsAlpha.greyscaleAlpha[15]};
    border-radius: 8px;
    background: ${({ theme }) => theme.colorsAlpha.greyscaleAlpha[5]};
    overflow: hidden;
    margin-bottom: 8px;

    &:last-child {
        margin-bottom: 0;
    }
`;

export const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    cursor: pointer;
    font-weight: 500;
    gap: 12px;
    user-select: none;
    transition: background-color 0.2s ease;

    &:hover {
        background: ${({ theme }) => theme.colorsAlpha.greyscaleAlpha[10]};
    }
`;

export const TextWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
    min-width: 0;
`;

export const Title = styled.div`
    font-size: 13px;
    font-weight: 600;
    line-height: 1.3;
    margin: 0;
    padding: 0;
    color: ${({ theme }) => theme.palette.text.primary};
`;

export const Subtitle = styled.div`
    color: ${({ theme }) => theme.palette.text.secondary};
    font-size: 11px;
    font-weight: 500;
    line-height: 1.4;
    opacity: 0.7;
`;

export const Content = styled(m.div) <{ $isOpen: boolean }>`
    overflow: hidden;
`;

export const ContentPadding = styled.div`
    padding: 0 16px 12px 16px;
`;

export const ChevronIcon = styled.svg<{ $isOpen: boolean }>`
    width: 18px;
    height: 18px;
    transform: scaleY(1);
    transition: transform 0.25s ease;
    flex-shrink: 0;
    color: ${({ theme }) => theme.palette.text.secondary};
    opacity: 0.6;

    ${({ $isOpen }) =>
        $isOpen &&
        css`
            transform: scaleY(-1);
            opacity: 1;
        `}
`;
