import { useBlockchainVisualisationStore } from '@app/store/useBlockchainVisualisationStore';
import { BlockTimeContainer, SpacedNum, TimerTypography, TimerWrapper, TitleTypography } from './BlockTime.styles';

import { useMiningStore } from '@app/store/useMiningStore.ts';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';

function BlockTime() {
    const { t } = useTranslation('mining-view', { useSuspense: false });
    const isCPUMining = useMiningStore((s) => s.cpu.mining.is_mining);
    const isGPUMining = useMiningStore((s) => s.gpu.mining.is_mining);
    const blockTime = useBlockchainVisualisationStore(useShallow((s) => s.displayBlockTime));
    const isConnectedToTari = useMiningStore((s) => s.base_node?.is_connected);
    const isMining = isCPUMining || isGPUMining;

    const { daysString, hoursString, minutes, seconds } = blockTime || {};

    const renderHours = hoursString && parseInt(hoursString) > 0;

    const daysMarkup = daysString?.length ? daysString : null;
    const hourMarkup = renderHours ? (
        <>{hoursString?.split('').map((c, i) => <SpacedNum key={`hr-${i}-${c}`}>{c}</SpacedNum>)}:</>
    ) : null;

    return blockTime && isMining && isConnectedToTari ? (
        <BlockTimeContainer layout layoutId="block-time">
            <TimerWrapper>
                <TimerTypography>
                    {daysMarkup}
                    {hourMarkup}
                    {minutes?.split('').map((c, i) => <SpacedNum key={`min-${i}-${c}`}>{c}</SpacedNum>)}:
                    {seconds?.split('').map((c, i) => <SpacedNum key={`sec-${i}-${c}`}>{c}</SpacedNum>)}
                </TimerTypography>
            </TimerWrapper>
            <TitleTypography>{t('current-block-time')}</TitleTypography>
        </BlockTimeContainer>
    ) : null;
}

export default BlockTime;
