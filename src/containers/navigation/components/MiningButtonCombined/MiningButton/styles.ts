import * as m from 'motion/react-m';
import styled, { css } from 'styled-components';
import ecoBackground from '../backgrounds/eco.png';
import ludicrousBackground from '../backgrounds/ludicrous.png';
import customBackground from '../backgrounds/custom.png';

export const ButtonWrapper = styled(m.div)<{ $selectedMode: string; $disabled: boolean }>`
    position: absolute;
    top: 0;
    left: 0;
    border-radius: 500px;
    width: 100%;
    height: 100%;

    display: flex;
    align-items: center;
    justify-content: space-between;

    background-color: #4c614a;
    box-shadow: 0px 0px 10px 0px rgba(104, 153, 55, 0.35);
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;

    padding: 0 6px 0 14px;

    transition:
        background 0.3s cubic-bezier(0.39, 0.3, 0.2, 0.87),
        box-shadow 0.3s cubic-bezier(0.39, 0.3, 0.2, 0.87);

    ${({ $selectedMode }) => {
        switch ($selectedMode) {
            case 'Eco':
                return css`
                    background-color: #4c614a;
                    box-shadow: 0px 0px 10px 0px rgba(104, 153, 55, 0.35);
                    background-image: url(${ecoBackground});
                `;

            case 'Ludicrous':
                return css`
                    background-color: #dc6e49;
                    box-shadow: 0px 0px 10px 0px rgba(153, 89, 55, 0.35);
                    background-image: url(${ludicrousBackground});
                `;

            case 'Custom':
                return css`
                    background-color: #397fb9;
                    box-shadow: 0px 0px 10px 0px rgba(55, 107, 153, 0.35);
                    background-image: url(${customBackground});
                `;
        }
    }}

    ${({ $disabled }) =>
        $disabled &&
        css`
            pointer-events: none;
        `}
`;

export const HitBox = styled.button`
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 10px;

    width: 100%;
    height: 100%;

    position: relative;
    z-index: 1;

    transition: opacity 0.3s cubic-bezier(0.39, 0.3, 0.2, 0.87);

    .mining_button-icon {
        transition: background-color 0.3s cubic-bezier(0.39, 0.3, 0.2, 0.87);
    }

    .mining_button-text {
        transition: transform 0.3s cubic-bezier(0.39, 0.3, 0.2, 0.87);
    }

    &:hover {
        .mining_button-icon {
            background: rgba(255, 255, 255, 0.3);
        }

        .mining_button-text {
            transform: scale(1.05);
        }
    }

    &:active {
        .mining_button-text {
            transform: scale(1);
        }
    }

    &:disabled {
        opacity: 0.5;
        pointer-events: none;
        cursor: default;

        .mining_button-icon {
            background: rgba(255, 255, 255, 0.3);
        }

        .mining_button-text {
            transform: scale(1);
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

    position: relative;
    z-index: 3;
`;

export const IconWrapper = styled.div<{ $absolute?: boolean }>`
    width: 27px;
    height: 27px;

    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    border-radius: 100%;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(17px);

    ${({ $absolute }) =>
        $absolute &&
        css`
            position: absolute;
            top: 50%;
            left: 14px;
            transform: translateY(-50%);
        `}
`;

export const Shadow = styled(m.div)`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(0deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.4) 100%);
    border-radius: 500px;
    z-index: 0;
`;
