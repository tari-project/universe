import { useTranslation } from 'react-i18next';
import styled, { css } from 'styled-components';
import { memo } from 'react';

const GridReference = styled.div`
    grid-area: hero;
    position: relative;
    min-height: 160px;
    z-index: 1;
`;

const TextWrapper = styled.div`
    display: grid;
    gap: calc(0.15rem + 1vh);
    grid-template-columns: 1fr 1fr 1fr;
    grid-auto-flow: dense;
    top: -100px;
    left: 0;
    user-select: none;
    pointer-events: none;

    font-family: Druk, sans-serif;
    font-size: calc(5rem + 15vmin);
    font-weight: 700;
    line-height: 0.8;
    text-transform: uppercase;
    white-space: nowrap;
    position: relative;
    width: min-content;

    .title-main {
        color: ${({ theme }) => theme.palette.text.contrast};
        background: ${({ theme }) => theme.palette.text.contrast};
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;

        ${({ theme }) => {
            if (theme.mode === 'dark') {
                return css`
                    background: -webkit-linear-gradient(#eee, #333);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                `;
            }
        }}
    }

    .title-ghost {
        color: transparent;
        -webkit-text-fill-color: transparent;
        -webkit-text-stroke: 2px rgba(255, 255, 255, 0.15);

        ${({ theme }) => {
            if (theme.mode === 'dark') {
                return css`
                    -webkit-text-stroke: 2px rgba(255, 255, 255, 0.035);
                `;
            }
        }}
    }
`;

const BEFORE_GHOSTS = Array(3).fill(null);
const AFTER_GHOSTS = Array(7).fill(null);
const HeroText = memo(function HeroText() {
    const { t } = useTranslation('common');
    const title = t('tari-universe');

    return (
        <GridReference>
            <TextWrapper>
                {BEFORE_GHOSTS.map((_, i) => (
                    <div className="title-ghost" key={`ghost-before-${i}`}>
                        {title}
                    </div>
                ))}
                <div className="title-main">{title}</div>
                {AFTER_GHOSTS.map((_, i) => (
                    <div className="title-ghost" key={`ghost-after-${i}`}>
                        {title}
                    </div>
                ))}
            </TextWrapper>
        </GridReference>
    );
});

export default HeroText;
