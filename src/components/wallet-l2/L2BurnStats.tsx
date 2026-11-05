import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { useMiningStore } from '@app/store/useMiningStore.ts';
import { handleAirdropRequest } from '@app/hooks/airdrop/utils/useHandleRequest.ts';

interface BurnStats {
    network: string;
    totalMicroMinotari: string;
    burnCount: number;
    uniqueBurners: number;
}

const REFRESH_MS = 60_000;
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
    display: grid;
    grid-template-columns: 1fr 1fr;
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

const Stat = styled.article<{ $total?: boolean; $divider?: boolean }>`
    position: relative;
    min-width: 0;
    padding: ${({ $total }) => ($total ? '26px 20px 20px' : '16px 20px')};
    grid-column: ${({ $total }) => ($total ? '1 / -1' : 'auto')};
    border-top: ${({ $total }) => ($total ? 'none' : '1px solid #d3c4e23b')};

    ${({ $divider }) =>
        $divider &&
        `&::before {
            content: '';
            position: absolute;
            left: 0;
            top: 16px;
            bottom: 16px;
            width: 1px;
            background: #d3c4e23b;
        }`}
`;

const Value = styled.span<{ $total?: boolean }>`
    display: block;
    font-family: Druk, sans-serif;
    font-weight: 800;
    font-size: ${({ $total }) => ($total ? '44px' : '28px')};
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

const fmt = (n: bigint | number) => n.toLocaleString('en-US');

/** Network-wide burn totals from the RWA API, refreshed every minute. Shows nothing until a valid response lands. */
export function L2BurnStats() {
    const { t } = useTranslation('wallet');
    const network = useMiningStore((s) => s.network);
    const [stats, setStats] = useState<BurnStats>();

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

    if (!isValid(stats, network)) return null;
    const micro = BigInt(stats.totalMicroMinotari);

    return (
        <Card $heat={heat(micro)} data-testid="l2-burn-stats">
            <Stat $total>
                <Value $total data-testid="l2-burn-total">
                    {fmt(micro / 1_000_000n)}
                </Value>
                <Label>{t('l2.burn-stats.total')}</Label>
            </Stat>
            <Stat>
                <Value data-testid="l2-burn-count">{fmt(stats.burnCount)}</Value>
                <Label>{t('l2.burn-stats.burns')}</Label>
            </Stat>
            <Stat $divider>
                <Value data-testid="l2-burn-people">{fmt(stats.uniqueBurners)}</Value>
                <Label>{t('l2.burn-stats.people')}</Label>
            </Stat>
        </Card>
    );
}
