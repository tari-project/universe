import { useTranslation } from 'react-i18next';

import { useBlockchainVisualisationStore } from '@app/store/useBlockchainVisualisationStore';
import { BlockTimeContainer, SpacedNum, TimerTypography, TitleTypography } from './BlockTime.styles';
import { useMiningMetricsStore } from '@app/store/useMiningMetricsStore.ts';

import { useAppConfigStore } from '@app/store/useAppConfigStore.ts';

function BlockTime() {
    const { t } = useTranslation('mining-view', { useSuspense: false });
    const isCPUMining = useMiningMetricsStore((s) => s.cpu_mining_status.is_mining);
    const isGPUMining = useMiningMetricsStore((s) => s.gpu_mining_status.is_mining);
    const displayBlockTime = useBlockchainVisualisationStore((s) => s.displayBlockTime);

    const isConnectedToTari = useMiningMetricsStore((s) => s.isNodeConnected);
    const visualMode = useAppConfigStore((s) => s.visual_mode);
    const isMining = isCPUMining || isGPUMining;

    const { daysString, hoursString, minutes, seconds } = displayBlockTime || {};

    const renderHours = hoursString && parseInt(hoursString) > 0;

    const daysMarkup = daysString?.length ? daysString : null;
    const hourMarkup = renderHours ? (
        <>{hoursString?.split('').map((c, i) => <SpacedNum key={`hr-${i}-${c}`}>{c}</SpacedNum>)}:</>
    ) : null;

    return displayBlockTime && isMining && isConnectedToTari ? (
        <BlockTimeContainer $visualModeOn={visualMode}>
            <TimerTypography>
                {daysMarkup}
                {hourMarkup}
                {minutes?.split('').map((c, i) => <SpacedNum key={`min-${i}-${c}`}>{c}</SpacedNum>)}:
                {seconds?.split('').map((c, i) => <SpacedNum key={`sec-${i}-${c}`}>{c}</SpacedNum>)}
            </TimerTypography>
            <TitleTypography>{t('current-block-time')}</TitleTypography>
        </BlockTimeContainer>
    ) : null;
}

export default BlockTime;
