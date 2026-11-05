import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled, { keyframes } from 'styled-components';
import { useMiningStore } from '@app/store/useMiningStore.ts';
import { handleAirdropRequest } from '@app/hooks/airdrop/utils/useHandleRequest.ts';

interface BurnStats {
    network: string;
    totalMicroMinotari: string;
    burnCount: number;
    uniqueBurners: number;
}

const REFRESH_MS = 60_000;
const ROTATE_MS = 5_000;
// A visual scale for the ember glow, not an issuance rule: full heat at 1M XTM.
const FULL_HEAT_MICRO = 1_000_000n * 1_000_000n;

const isValid = (d: BurnStats | undefined, network?: string): d is BurnStats =>
    !!d &&
    d.network === network &&
    Number.isSafeInteger(d.burnCount) &&
    d.burnCount >= 0 &&
    Number.isSafeInteger(d.uniqueBurners) &&
    d.uniqueBurners >= 0 &&
    typeof d.totalMicroMinotari === 'string' &&
    /^\d+$/.test(d.totalMicroMinotari);

const heat = (micro: bigint) =>
    Math.log1p(Number(micro > FULL_HEAT_MICRO ? FULL_HEAT_MICRO : micro) / 1e9) / Math.log1p(1000);

// Mirrors the tari-burn-design stats panel, dark in both themes like the countdown above it.
const Card = styled.section<{ $heat: number }>`
    position: relative;
    isolation: isolate;
    overflow: hidden;
    width: 100%;
    padding: 24px 20px 16px;
    border-radius: 20px;
    background: #0c0718;
    color: #fbf7ef;
    box-shadow: 0 16px 45px #34204a25;

    &::before {
        content: '';
        position: absolute;
        inset: 0;
        z-index: -1;
        background: radial-gradient(ellipse at 50% 115%, #ff6c26 0%, #b52e24 35%, transparent 70%);
        opacity: ${({ $heat }) => 0.12 + 0.2 * $heat};
    }
`;

const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: none; }
`;

const Slide = styled.article`
    animation: ${fadeIn} 0.4s ease-out;

    @media (prefers-reduced-motion: reduce) {
        animation: none;
    }
`;

const Value = styled.span`
    display: block;
    font-family: Druk, sans-serif;
    font-weight: 800;
    font-size: 44px;
    line-height: 1;
    letter-spacing: -0.025em;
    font-variant-numeric: tabular-nums;
    overflow-wrap: anywhere;
    text-shadow: 0 3px 28px #06030cc0;
`;

const Label = styled.h2`
    margin: 8px 0 0;
    font-size: 13px;
    line-height: 1.4;
    font-weight: 400;
    color: #e2d6eb;
`;

const Dots = styled.div`
    display: flex;
    gap: 6px;
    margin-top: 16px;
`;

const Dot = styled.button<{ $active: boolean }>`
    width: ${({ $active }) => ($active ? '18px' : '6px')};
    height: 6px;
    padding: 0;
    border: none;
    border-radius: 3px;
    background: ${({ $active }) => ($active ? '#fbf7ef' : '#d3c4e25c')};
    cursor: pointer;
    transition: width 0.3s ease;
`;

const fmt = (n: bigint | number) => n.toLocaleString('en-US');

/** Network-wide burn totals from the RWA API, refreshed every minute and rotated one at a time. Shows nothing until a valid response lands. */
export function L2BurnStats() {
    const { t } = useTranslation('wallet');
    const network = useMiningStore((s) => s.network);
    const [stats, setStats] = useState<BurnStats>();
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (!network) return;
        let live = true;
        const load = () =>
            handleAirdropRequest<BurnStats>({
                path: `/miner/burns/stats?network=${network}`,
                method: 'GET',
                publicRequest: true,
            })
                .then((d) => live && isValid(d, network) && setStats(d))
                .catch((e) => console.warn('Burn stats request failed', e));
        void load();
        const timer = setInterval(load, REFRESH_MS);
        return () => {
            live = false;
            clearInterval(timer);
        };
    }, [network]);

    // Keyed on the index, so picking a dot restarts the wait for the next slide.
    useEffect(() => {
        const timer = setTimeout(() => setIndex((i) => (i + 1) % 3), ROTATE_MS);
        return () => clearTimeout(timer);
    }, [index]);

    if (!isValid(stats, network)) return null;
    const micro = BigInt(stats.totalMicroMinotari);
    const slides = [
        [fmt(micro / 1_000_000n), t('l2.burn-stats.total')],
        [fmt(stats.burnCount), t('l2.burn-stats.burns')],
        [fmt(stats.uniqueBurners), t('l2.burn-stats.people')],
    ];
    const [value, label] = slides[index];

    return (
        <Card $heat={heat(micro)} data-testid="l2-burn-stats">
            <Slide key={index}>
                <Value data-testid="l2-burn-value">{value}</Value>
                <Label>{label}</Label>
            </Slide>
            <Dots>
                {slides.map(([, l], i) => (
                    <Dot
                        key={l}
                        $active={i === index}
                        aria-label={l}
                        aria-current={i === index}
                        onClick={() => setIndex(i)}
                    />
                ))}
            </Dots>
        </Card>
    );
}
