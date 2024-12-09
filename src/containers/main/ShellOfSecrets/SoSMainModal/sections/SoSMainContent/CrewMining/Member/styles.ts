import styled, { css } from 'styled-components';

export const Wrapper = styled('div')<{ $isOnline: boolean }>`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
    position: relative;

    ${({ $isOnline }) =>
        !$isOnline &&
        css`
            transition: filter 0.3s ease;
            filter: grayscale(1);
            cursor: pointer;

            .nudge-btn {
                opacity: 0;
                transition:
                    opacity 0.3s ease,
                    transform 0.3s ease;
            }

            .avatar-svg {
                transition: transform 0.3s ease;
            }

            &:hover {
                filter: grayscale(0);

                .avatar-svg {
                    transform: translateY(-5px);
                }

                .nudge-btn {
                    opacity: 1;
                    transform: translateY(-7px);
                }
            }
        `}
`;

export const MiningRate = styled('div')`
    color: #e6ff47;
    text-align: center;
    font-size: 12px;
    font-weight: 700;
    line-height: 129.623%;
    text-transform: uppercase;
`;

export const NewPill = styled('div')`
    position: absolute;
    left: 50%;
    top: -8px;
    transform: translateX(-50%);

    border-radius: 40px;
    border: 3px solid #121417;
    background: #3ce7fa;

    display: flex;
    justify-content: center;
    align-items: center;

    padding: 0px 8px;

    color: #000;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: -0.924px;
    text-transform: uppercase;
`;

export const NudgeButton = styled('button')`
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    line-height: normal;
    text-transform: uppercase;

    border-radius: 9px;
    background: rgba(255, 255, 255, 0.1);

    display: flex;
    justify-content: center;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;

    width: 77px;
    height: 30px;
    padding: 0px 14px 0px 10px;
`;
