import styled, { css } from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';
import { m } from 'motion/react';

export const QRContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    border-radius: 20px;
    background: ${({ theme }) => theme.colors.greyscale[950]};
    padding: 15px;
    gap: 10px;

    align-items: center;
`;
export const AddressContainer = styled.div`
    display: flex;
    flex-direction: column;

    gap: 8px;

    border-radius: 15px;
    background: #fff;
    padding: 10px 15px;
    width: 100%;

    position: relative;
`;

export const ContentWrapper = styled.div`
    display: flex;
    width: 100%;
    justify-content: space-between;
    align-items: center;
`;
export const EmojiAddressWrapper = styled.div`
    p {
        font-size: 22px;
    }
    span {
        font-size: 20px;
        font-weight: 600;
        letter-spacing: -1.6px;
    }
`;

export const AddressWrapper = styled.div`
    display: flex;
    align-items: center;
    width: 100%;
    height: 34px;
    gap: 10px;

    color: #111;
    font-family: Poppins, sans-serif;
    font-size: 22px;
    font-style: normal;
    font-weight: 500;
    line-height: normal;
    letter-spacing: -1.76px;
`;

export const ToggleWrapper = styled.div`
    display: flex;
`;

export const ImgOption = styled.div`
    width: 14px;
    img {
        max-width: 100%;
    }
`;
export const TextOption = styled.div`
    font-weight: 500;
    font-size: 8px;
    color: inherit;
`;

export const Label = styled(Typography).attrs({
    variant: 'p',
})`
    font-weight: 500;
    color: rgba(0, 0, 0, 0.5);
`;

export const CopyAddressButton = styled.button<{ $isCopied: boolean }>`
    border-radius: 32px;
    background: #523df1;

    display: flex;
    align-items: center;
    justify-content: center;

    height: 60px;
    width: 100%;

    padding: 12px 22px;

    color: #fff;
    font-family: Poppins, sans-serif;
    font-size: 13px;
    font-style: normal;
    font-weight: 600;
    line-height: 26px;
    letter-spacing: 0.46px;

    transition: background 0.2s ease;

    ${({ $isCopied }) =>
        $isCopied &&
        css`
            background: #19ad34;
        `}
`;

export const Tooltip = styled(m.div)`
    border-radius: 10px;
    background: #fff;
    box-shadow: 0px 4px 34px 0px rgba(0, 0, 0, 0.15);

    position: absolute;
    right: 100%;
    top: 50%;
    transform: translateY(-50%);

    padding: 15px;
    width: 270px;
    margin-right: 12px;

    &::after {
        content: '';
        position: absolute;
        right: -8px;
        top: 50%;
        transform: translateY(-50%);
        width: 0;
        height: 0;
        border-top: 8px solid transparent;
        border-bottom: 8px solid transparent;
        border-left: 8px solid #fff;
    }
`;

export const TooltipTitle = styled.div`
    color: #000;
    font-family: Poppins, sans-serif;
    font-size: 14px;
    font-style: normal;
    font-weight: 700;
    line-height: 13px;
`;

export const TooltipText = styled.div`
    color: #000;
    font-family: Poppins, sans-serif;
    font-size: 12px;
    font-style: normal;
    font-weight: 500;
    line-height: 108.333%;

    p {
        margin-bottom: 10px;

        &:last-child {
            margin-bottom: 0;
        }
    }
`;
