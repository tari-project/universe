import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled, { keyframes } from 'styled-components';
import { useConfigCoreStore } from '@app/store/stores/config/useConfigCoreStore.ts';

interface NetworkEconomics {
    total_claimed: string;
}

const REFRESH_MS = 60_000;
// A visual scale for the ember glow, not an issuance rule: full heat at 1M XTM.
const FULL_HEAT_MICRO = 1_000_000n * 1_000_000n;

const isValid = (d: unknown): d is NetworkEconomics =>
    typeof d === 'object' &&
    d !== null &&
    'total_claimed' in d &&
    typeof d.total_claimed === 'string' &&
    /^\d+$/.test(d.total_claimed);

const economicsUrl = (indexerUrl: string | null | undefined): string | null => {
    if (!indexerUrl) return null;
    try {
        const base = new URL(indexerUrl);
        if (base.protocol !== 'http:' && base.protocol !== 'https:') return null;
        if (!base.pathname.endsWith('/')) base.pathname += '/';
        return new URL('network/economics', base).toString();
    } catch {
        return null;
    }
};

const heat = (micro: bigint) =>
    Math.log1p(Number(micro > FULL_HEAT_MICRO ? FULL_HEAT_MICRO : micro) / 1e9) / Math.log1p(1000);

// Mirrors the tari-burn-design stats panel, dark in both themes like the countdown above it.
const Card = styled.section<{ $heat: number }>`
    position: relative;
    isolation: isolate;
    overflow: hidden;
    /* The sidebar is a full-height flex column; overflow: hidden would otherwise let the wallet card squeeze this one. */
    flex-shrink: 0;
    width: 100%;
    padding: 24px 20px;
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

const fmt = (n: bigint) => n.toLocaleString('en-US');

/** Network-wide XTM burned and claimed on Ootle, polled from the configured Ootle indexer every minute. Shows nothing until a valid response lands. */
export function L2BurnStats() {
    const { t } = useTranslation('wallet');
    const indexerUrl = useConfigCoreStore((s) => s.ootle_indexer_url);
    const [result, setResult] = useState<{ url: string; economics: NetworkEconomics }>();
    const url = economicsUrl(indexerUrl);

    useEffect(() => {
        if (!url) return;
        let live = true;
        const controller = new AbortController();
        const load = async () => {
            try {
                const res = await fetch(url, { signal: controller.signal });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data: unknown = await res.json();
                if (live && isValid(data)) setResult({ url, economics: data });
            } catch (e) {
                if (live && !controller.signal.aborted) {
                    console.warn('Burn stats request failed', e);
                }
            }
        };
        void load();
        const timer = setInterval(() => void load(), REFRESH_MS);
        return () => {
            live = false;
            controller.abort();
            clearInterval(timer);
        };
    }, [url]);

    const stats = url && result?.url === url ? result.economics : undefined;
    if (!stats) return null;
    const micro = BigInt(stats.total_claimed);

    return (
        <Card $heat={heat(micro)} data-testid="l2-burn-stats">
            <Slide>
                <Value data-testid="l2-burn-value">{fmt(micro / 1_000_000n)}</Value>
                <Label>{t('l2.burn-stats.total')}</Label>
            </Slide>
        </Card>
    );
}
