import * as m from 'motion/react-m';
import styled, { css } from 'styled-components';

export const PositionWrapper = styled(m.div)`
    position: fixed;
    top: 0;
    right: 0;
    z-index: 999999;
    pointer-events: none;
    height: 100%;
    padding: 12px;
`;

export const Holder = styled('div')`
    position: relative;
    z-index: 1;
    width: 100%;
    height: 100%;
    display: flex;
    pointer-events: none;
`;

export const WidgetWrapper = styled('div')<{ $isOpen: boolean }>`
    pointer-events: all;

    border-radius: 13px;
    border: 1px solid rgba(225, 225, 225, 0.1);
    background: #323333;
    box-shadow:
        0px 4px 25px 0px rgba(0, 0, 0, 0.25),
        0px 0px 3px 2px rgba(242, 216, 255, 0.2) inset;

    display: flex;
    flex-direction: column;
    align-items: flex-start;
    flex-shrink: 0;
    gap: 20px;

    width: 411px;
    height: 100%;
    padding: 20px;
    padding-bottom: 0px;

    max-height: 115px;
    position: relative;
    z-index: 1;

    transition: max-height 0.2s cubic-bezier(0.4, 0, 0.2, 1);

    * {
        pointer-events: all;
    }

    ${({ $isOpen }) =>
        $isOpen &&
        css`
            max-height: 830px;
        `}
`;
