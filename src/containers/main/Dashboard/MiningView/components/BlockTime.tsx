import { useTranslation } from 'react-i18next';

import { BlockTimeContainer, SpacedNum, TimerTypography, TitleTypography } from './BlockTime.styles';
import { useMiningMetricsStore } from '@app/store/useMiningMetricsStore.ts';
import { useConfigUIStore } from '@app/store';

import useBlockTime from '@app/hooks/mining/useBlockTime.ts';

function BlockTime() {
    const { currentTimeParts } = useBlockTime();
    const { t } = useTranslation('mining-view', { useSuspense: false });

    const isConnectedToTari = useMiningMetricsStore((s) => s.isNodeConnected);
    const visualMode = useConfigUIStore((s) => s.visual_mode);

    const { daysString, hoursString, minutes, seconds } = currentTimeParts || {};

    const renderHours = hoursString && parseInt(hoursString) > 0;

    const daysMarkup = daysString?.length ? daysString : null;
    const hourMarkup = renderHours ? (
        <>
            {hoursString?.split('').map((c, i) => (
                <SpacedNum key={`hr-${i}-${c}`}>{c}</SpacedNum>
            ))}
            :
        </>
    ) : null;

    return isConnectedToTari ? (
        <BlockTimeContainer $visualModeOn={visualMode}>
            <TimerTypography>
                {daysMarkup}
                {hourMarkup}
                {minutes?.split('').map((c, i) => (
                    <SpacedNum key={`min-${i}-${c}`}>{c}</SpacedNum>
                ))}
                :
                {seconds?.split('').map((c, i) => (
                    <SpacedNum key={`sec-${i}-${c}`}>{c}</SpacedNum>
                ))}
            </TimerTypography>
            <TitleTypography>{t('current-block-time')}</TitleTypography>
        </BlockTimeContainer>
    ) : null;
}

export default BlockTime;
