import { useTranslation } from 'react-i18next';

import useBlockTime from '@app/hooks/mining/useBlockTime.ts';
import { useNodeStore } from '@app/store/useNodeStore.ts';
import { BlockTimeContainer, SpacedNum, TimerTypography, TitleTypography } from './BlockTime.styles';

function BlockTime() {
    const { currentTimeParts } = useBlockTime();
    const { t } = useTranslation('mining-view', { useSuspense: false });
    const isConnectedToTari = useNodeStore((s) => s.isNodeConnected);
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
        <BlockTimeContainer>
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
