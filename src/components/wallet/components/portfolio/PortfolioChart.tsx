import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'styled-components';
import { useWalletStore } from '@app/store';
import { Typography } from '@app/components/elements/Typography.tsx';
import { formatNumber, FormatPreset } from '@app/utils';
import { getPortfolioSummary, PortfolioPoint } from './utils.ts';
import { ChangeBadge, ChartSvg, PortfolioHeader, PortfolioWrapper } from './styles.ts';

const VIEW_WIDTH = 300;
const VIEW_HEIGHT = 56;
const PADDING_Y = 4;

function buildPaths(series: PortfolioPoint[]): { line: string; area: string } {
    if (series.length === 0) return { line: '', area: '' };

    const minBalance = Math.min(...series.map((p) => p.balance));
    const maxBalance = Math.max(...series.map((p) => p.balance));
    const minTime = series[0].timestamp;
    const maxTime = series[series.length - 1].timestamp;

    const spanBalance = maxBalance - minBalance;
    const spanTime = maxTime - minTime;

    const points = series.map((p) => {
        const x = spanTime > 0 ? ((p.timestamp - minTime) / spanTime) * VIEW_WIDTH : VIEW_WIDTH / 2;
        const y =
            spanBalance > 0
                ? VIEW_HEIGHT - PADDING_Y - ((p.balance - minBalance) / spanBalance) * (VIEW_HEIGHT - PADDING_Y * 2)
                : VIEW_HEIGHT / 2;
        return { x, y };
    });

    const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
    const area = `${line} L${points[points.length - 1].x.toFixed(2)},${VIEW_HEIGHT} L${points[0].x.toFixed(2)},${VIEW_HEIGHT} Z`;
    return { line, area };
}

export default function PortfolioChart() {
    const { t } = useTranslation('wallet');
    const transactions = useWalletStore((s) => s.wallet_transactions);
    const total = useWalletStore((s) => s.account_balance?.total);

    const { series, changePercent } = useMemo(
        () => getPortfolioSummary(transactions, total || 0),
        [transactions, total]
    );

    const theme = useTheme();
    const { line, area } = useMemo(() => buildPaths(series), [series]);
    const positive = changePercent >= 0;
    const stroke = positive ? theme.palette.success.main : theme.palette.error.main;

    return (
        <PortfolioWrapper data-testid="portfolio-chart">
            <PortfolioHeader>
                <Typography variant="p">{t('portfolio.title')}</Typography>
                <ChangeBadge $positive={positive} data-testid="portfolio-change">
                    {`${positive ? '+' : ''}${formatNumber(changePercent / 100, FormatPreset.PERCENT)}`}
                </ChangeBadge>
            </PortfolioHeader>
            <ChartSvg
                viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
                preserveAspectRatio="none"
                data-testid="portfolio-svg"
            >
                <defs>
                    <linearGradient id="portfolio-area-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
                        <stop offset="100%" stopColor={stroke} stopOpacity="0" />
                    </linearGradient>
                </defs>
                {area && <path d={area} fill="url(#portfolio-area-fill)" />}
                {line && (
                    <path
                        d={line}
                        fill="none"
                        stroke={stroke}
                        strokeWidth="2"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                    />
                )}
            </ChartSvg>
        </PortfolioWrapper>
    );
}
