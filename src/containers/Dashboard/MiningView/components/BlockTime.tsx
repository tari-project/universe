import { BlockTimeContainer, SpacedNum, TimerTypography, TitleTypography } from './BlockTime.styles';

import { useCPUStatusStore } from '@app/store/useCPUStatusStore.ts';
import { useShallow } from 'zustand/react/shallow';
import { useMiningStore } from '@app/store/useMiningStore.ts';
import { useTranslation } from 'react-i18next';
import { useGPUStatusStore } from '@app/store/useGPUStatusStore.ts';

function BlockTime() {
    const { t } = useTranslation('mining-view', { useSuspense: false });
    const isCPUMining = useCPUStatusStore(useShallow((s) => s.is_mining));
    const isGPUMining = useGPUStatusStore(useShallow((s) => s.is_mining));
    const blockTime = useMiningStore(useShallow((s) => s.displayBlockTime));
    const isMining = isCPUMining || isGPUMining;

    const { daysString, hoursString, minutes, seconds } = blockTime || {};
    return (
        <>
            {blockTime && isMining ? (
                <BlockTimeContainer>
                    <TimerTypography>
                        {daysString}
                        {hoursString?.split('').map((c, i) => <SpacedNum key={`hr-${i}-${c}`}>{c}</SpacedNum>)}:
                        {minutes?.split('').map((c, i) => <SpacedNum key={`min-${i}-${c}`}>{c}</SpacedNum>)}:
                        {seconds?.split('').map((c, i) => <SpacedNum key={`sec-${i}-${c}`}>{c}</SpacedNum>)}
                    </TimerTypography>
                    <TitleTypography>{t('current-block-time')}</TitleTypography>
                </BlockTimeContainer>
            ) : null}
        </>
    );
}

export default BlockTime;
