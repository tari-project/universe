import styled, { css, keyframes } from 'styled-components';
import { convertHexToRGBA } from '@app/utils';

export const Wrapper = styled.div<{ $isModuleFailed?: boolean }>`
    width: 100%;
    height: 84px;

    display: flex;
    position: relative;

    border-radius: 10px;
    padding: 1px;

    background: ${({ theme }) => theme.palette.divider};
    overflow: hidden;
    z-index: 1;
    cursor: ${({ $isModuleFailed }) => ($isModuleFailed ? 'pointer' : 'default')};
`;

export const Inside = styled.div<{ $isSyncing?: boolean }>`
    position: relative;
    z-index: 1;
    width: 100%;
    height: 100%;

    display: flex;
    flex-direction: column;
    justify-content: space-between;

    border-radius: 10px;
    padding: 6px 10px;

    background: ${({ theme }) => theme.palette.background.paper};

    ${({ $isSyncing }) =>
        $isSyncing &&
        css`
            background: ${({ theme }) => theme.palette.background.accent};
        `}
`;

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

export const AnimatedGlowPosition = styled.div`
    position: absolute;
    top: 50%;
    left: 50%;
    width: 140%;
    height: 100%;
    transform: translate(-50%, -50%);
    display: flex;
    align-items: center;
    justify-content: center;
`;

export const AnimatedGlow = styled.div`
    width: 200%;
    aspect-ratio: 1;
    z-index: 0;
    background: conic-gradient(
        ${({ theme }) => theme.palette.success.main} 0deg,
        ${({ theme }) => theme.palette.divider} 60deg,
        ${({ theme }) => theme.palette.success.main} 180deg,
        ${({ theme }) => theme.palette.divider} 240deg,
        ${({ theme }) => theme.palette.success.main} 360deg
    );
    animation: ${rotate} 4s linear infinite;
`;

export const HeadingRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
`;

export const LabelWrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 5px;
    img {
        width: 14px;
    }
`;

export const StatusDot = styled.div<{
    $isMining: boolean;
    $isEnabled: boolean;
    $isSyncing?: boolean;
}>`
    width: 6px;
    height: 6px;
    border-radius: 50%;

    ${({ $isEnabled, $isMining, $isSyncing, theme }) =>
        $isEnabled
            ? css`
                  background: ${$isSyncing
                      ? '#D29807'
                      : $isMining
                        ? '#33CD7E'
                        : convertHexToRGBA(theme.palette.contrast, 0.5)};
              `
            : css`
                  background: ${theme.palette.divider};
              `}
`;

export const LabelText = styled.span`
    color: ${({ theme }) => theme.palette.text.secondary};
    font-family: Poppins, sans-serif;
    font-size: 12px;
    font-style: normal;
    font-weight: 500;
    line-height: normal;
`;

export const RatePill = styled.div`
    display: flex;

    justify-content: center;
    align-items: center;
    gap: 10px;

    height: 19px;
    padding: 0 6px;
    border-radius: 40px;
    background: ${({ theme }) => theme.palette.divider};

    color: ${({ theme }) => theme.palette.text.secondary};
    font-family: Poppins, sans-serif;
    font-size: 10px;
    font-style: normal;
    font-weight: 600;
    line-height: normal;
    letter-spacing: -0.2px;
`;

export const NumberGroup = styled.div`
    display: flex;
    flex-direction: column;
`;

export const BigNumber = styled.div`
    display: flex;
    align-items: flex-end;
    gap: 3px;
`;

export const Number = styled.span<{ $isIdle?: boolean }>`
    color: ${({ theme }) => theme.palette.text.primary};
    font-family: Poppins, sans-serif;
    font-size: 22px;
    font-style: normal;
    font-weight: 600;
    line-height: 95%;
    letter-spacing: -0.2px;

    transform: ${({ $isIdle }) => ($isIdle ? '' : ' translateY(7px)')};
`;

export const NumberUnit = styled.span`
    color: ${({ theme }) => theme.palette.text.primary};
    font-family: Poppins, sans-serif;
    font-size: 10px;
    font-style: normal;
    font-weight: 600;
    line-height: 1.2;
`;

export const NumberLabel = styled.div`
    color: ${({ theme }) => theme.palette.text.secondary};
    font-family: Poppins, sans-serif;
    font-size: 10px;
    font-style: normal;
    font-weight: 400;
    line-height: normal;
`;
