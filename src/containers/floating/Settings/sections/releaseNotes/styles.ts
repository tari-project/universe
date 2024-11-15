import styled from 'styled-components';

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

    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
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
`;

export const Title = styled('div')`
    color: #000;
    font-size: 14px;
    font-weight: 500;
    line-height: 110%;
`;

export const Text = styled('div')`
    color: #797979;
    font-size: 12px;
    font-weight: 500;
    line-height: 116.667%;
`;

export const MarkdownWrapper = styled('div')`
    overflow: hidden;
    overflow-y: auto;
    height: calc(70vh - 110px);

    padding: 0px 20px 60px 0;

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
        color: #000;
        font-size: 14px;
        font-weight: 600;
        line-height: 110%;
        margin-bottom: 15px;
    }

    ul {
        padding: 0;
        padding-left: 24px;

        li {
            color: #797979;
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
`;
