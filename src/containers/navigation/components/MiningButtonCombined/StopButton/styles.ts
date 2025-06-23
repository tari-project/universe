import * as m from 'motion/react-m';
import styled, { css } from 'styled-components';

export const StopWrapper = styled(m.div)<{ $selectedMode: string }>`
    position: relative;
    border-radius: 500px;
    width: 100%;
    height: 100%;

    display: flex;
    align-items: center;
    justify-content: space-between;

    background: #4c614a;
    box-shadow:
        0px 0px 10px 0px rgba(104, 153, 55, 0.35),
        0px 0px 13px 0px rgba(238, 255, 217, 0.5) inset;

    padding: 0 6px 0 14px;

    transition:
        background 0.3s cubic-bezier(0.39, 0.3, 0.2, 0.87),
        box-shadow 0.3s cubic-bezier(0.39, 0.3, 0.2, 0.87);

    ${({ $selectedMode }) => {
        switch ($selectedMode) {
            case 'Eco':
                return css`
                    background: #4c614a;
                    box-shadow:
                        0px 0px 10px 0px rgba(104, 153, 55, 0.35),
                        0px 0px 13px 0px rgba(238, 255, 217, 0.5) inset;
                `;

            case 'Ludicrous':
                return css`
                    background: #dc6e49;
                    box-shadow:
                        0px 0px 10px 0px rgba(153, 89, 55, 0.35),
                        0px 0px 13px 0px rgba(255, 244, 175, 0.5) inset;
                `;

            case 'Custom':
                return css`
                    background: #397fb9;
                    box-shadow:
                        0px 0px 10px 0px rgba(55, 107, 153, 0.35),
                        0px 0px 13px 0px rgba(175, 210, 255, 0.5) inset;
                `;
        }
    }}
`;

export const HitBox = styled.button`
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 10px;

    width: 100%;
    height: 100%;

    .stop-icon {
        transition: background-color 0.3s cubic-bezier(0.39, 0.3, 0.2, 0.87);
    }

    .stop-text {
        transition: transform 0.3s cubic-bezier(0.39, 0.3, 0.2, 0.87);
    }

    &:hover {
        .stop-icon {
            background: rgba(255, 255, 255, 0.3);
        }

        .stop-text {
            transform: scale(1.05);
        }
    }
`;

export const Text = styled.div`
    color: #f0f1f1;
    text-align: center;

    font-family: Poppins, sans-serif;
    font-size: 16px;
    font-style: normal;
    font-weight: 600;
    line-height: 110%;
    letter-spacing: -0.48px;
`;

export const DropdownWrapper = styled.div`
    width: 139px;
    flex-shrink: 0;
`;
