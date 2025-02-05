import { useTranslation } from 'react-i18next';
import styled, { css } from 'styled-components';
import { memo } from 'react';
import { useParallax } from '@app/hooks/ui/useParallax';
import * as m from 'motion/react-m';

const TEXT_STYLE_BASE = css`
    font-family: Druk, sans-serif;
    font-size: calc(5rem + 15vmin);
    font-weight: 700;
    line-height: 0.8;
    text-transform: uppercase;
    white-space: nowrap;
    position: relative;
    width: min-content;
    user-select: none;
`;
const SetupTextMain = styled.div`
    color: ${({ theme }) => theme.palette.text.contrast};
    background: ${({ theme }) => theme.palette.text.contrast};
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;

    ${({ theme }) => {
        if (theme.mode === 'dark') {
            return css`
                background: -webkit-linear-gradient(#eee, #333);
                background-clip: text;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            `;
        }
    }}
    ${TEXT_STYLE_BASE}
`;

const SetupTextGhost = styled.div`
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
    ${TEXT_STYLE_BASE}
`;

const TextWrapper = styled(m.div)`
    display: grid;
    gap: calc(0.15rem + 1vh);
    grid-template-columns: 1fr 1fr 1fr;
    grid-auto-flow: dense;
    position: absolute;
    top: -100px;
    left: 0;
    user-select: none;
    pointer-events: none;
`;

const GridReference = styled.div`
    grid-area: hero;
    position: relative;
    min-height: 160px;
    z-index: 1;
`;

const BEFORE_GHOSTS = Array(3).fill(null);
const AFTER_GHOSTS = Array(7).fill(null);

const HeroText = memo(function HeroText() {
    const { t } = useTranslation('common');
    const { x, y } = useParallax(2.5);

    return (
        <GridReference>
            <TextWrapper
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                style={{ x: x as any, y: y as any }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 1 }}
            >
                {BEFORE_GHOSTS.map((_, i) => (
                    <SetupTextGhost key={`ghost-before-${i}`}>{t('tari-universe')}</SetupTextGhost>
                ))}
                <SetupTextMain>{t('tari-universe')}</SetupTextMain>
                {AFTER_GHOSTS.map((_, i) => (
                    <SetupTextGhost key={`ghost-after-${i}`}>{t('tari-universe')}</SetupTextGhost>
                ))}
            </TextWrapper>
        </GridReference>
    );
});

export default HeroText;
