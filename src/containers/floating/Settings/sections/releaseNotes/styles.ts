import styled, { css } from 'styled-components';

export const Wrapper = styled('div')`
    display: flex;
    flex-direction: column;
    overflow: hidden;
    height: 100%;
`;

export const VersionWrapper = styled('div')`
    display: flex;
    align-items: center;
    gap: 20px;

    border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
    margin-bottom: 5px;
    padding-bottom: 30px;
`;

export const IconImage = styled('img')`
    width: 59px;
`;

export const TextWrapper = styled('div')`
    display: flex;
    flex-direction: column;
    gap: 5px;
    width: 100%;
`;

export const Title = styled('div')`
    font-size: 14px;
    font-weight: 500;
    line-height: 110%;
`;

export const Text = styled('div')`
    color: ${({ theme }) => theme.palette.text.secondary};
    font-size: 12px;
    font-weight: 500;
    line-height: 116.667%;
`;

export const MarkdownWrapper = styled('div')<{ $showScrollBars?: boolean }>`
    position: relative;
    overflow: hidden;
    overflow-y: auto;
    height: calc(70vh - 210px);
    padding: 0 0 60px 0;

    @media (min-width: 1200px) {
        height: calc(80vh - 210px);
    }

    &::-webkit-scrollbar {
        width: 8px;
        display: unset;
    }

    &::-webkit-scrollbar-thumb {
        background-color: rgba(0, 0, 0, 0.2);
        border-radius: 4px;
    }

    &::-webkit-scrollbar-track {
        background-color: rgba(0, 0, 0, 0.1);
    }

    h2 {
        font-size: 14px;
        font-weight: 600;
        line-height: 110%;
        margin: 0;
        margin-bottom: 15px;
    }

    ul {
        padding: 0;
        padding-left: 24px;
        margin-bottom: 15px;

        li {
            color: ${({ theme }) => theme.palette.text.secondary};
            font-size: 12px;
            font-weight: 500;
            line-height: 141.667%;
        }
    }

    hr {
        border: none;
        border-top: 1px solid rgba(0, 0, 0, 0.05);
        margin: 25px 0;
    }

    p {
        color: ${({ theme }) => theme.palette.text.secondary};
        font-size: 12px;
        font-weight: 500;
        line-height: 141.667%;
        margin: 0;
        margin-bottom: 15px;
    }

    ${({ $showScrollBars }) =>
        $showScrollBars &&
        css`
            &::-webkit-scrollbar {
                display: block;
                scrollbar-width: auto;
            }
        `}

    ${({ $showScrollBars }) =>
        $showScrollBars &&
        css`
            &::-webkit-scrollbar {
                display: block !important;
            }
            & {
                scrollbar-width: auto;
                scrollbar-color: rgba(0, 0, 0, 0.2) rgba(0, 0, 0, 0.1);
                padding-right: 10px;
            }
        `}
`;

export const UpgradeButton = styled('button')`
    flex-shrink: 0;

    color: #fff;

    font-size: 11px;
    font-weight: 600;
    line-height: 99.7%;
    white-space: nowrap;

    border-radius: 49px;
    background: #000;

    padding: 10px 16px;

    cursor: pointer;
`;
