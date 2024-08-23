import { BlockTimeContainer, TimerTypography, TitleTypography } from './BlockTime.styles';

import { useCPUStatusStore } from '@app/store/useCPUStatusStore.ts';
import { useShallow } from 'zustand/react/shallow';
import { useMiningStore } from '@app/store/useMiningStore.ts';

function BlockTime() {
    const isMining = useCPUStatusStore(useShallow((s) => s.is_mining));

    const blockTime = useMiningStore((s) => s.blockTime);

    const { daysString, hoursString, minutes, seconds } = blockTime || {};

    return (
        <>
            {blockTime && isMining ? (
                <BlockTimeContainer>
                    <TimerTypography>
                        {daysString}
                        {hoursString} : {minutes} : {seconds}
                    </TimerTypography>
                    <TitleTypography>Current block time</TitleTypography>
                </BlockTimeContainer>
            ) : null}
        </>
    );
}

export default BlockTime;
