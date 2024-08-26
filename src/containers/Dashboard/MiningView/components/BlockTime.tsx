import { BlockTimeContainer, SpacedNum, TimerTypography, TitleTypography } from './BlockTime.styles';

import { useCPUStatusStore } from '@app/store/useCPUStatusStore.ts';
import { useShallow } from 'zustand/react/shallow';
import { useMiningStore } from '@app/store/useMiningStore.ts';

function BlockTime() {
    const isMining = useCPUStatusStore(useShallow((s) => s.is_mining));

    const blockTime = useMiningStore((s) => s.displayBlockTime);

    const { daysString, hoursString, minutes, seconds } = blockTime || {};
    return (
        <>
            {blockTime && isMining ? (
                <BlockTimeContainer>
                    <TimerTypography>
                        {daysString}
                        {hoursString?.split('').map((c, i) => <SpacedNum key={`${c}-${i}`}>{c}</SpacedNum>)}:
                        {minutes?.split('').map((c, i) => <SpacedNum key={`${c}-${i}`}>{c}</SpacedNum>)}:
                        {seconds?.split('').map((c, i) => <SpacedNum key={`${c}-${i}`}>{c}</SpacedNum>)}
                    </TimerTypography>
                    <TitleTypography>Current block time</TitleTypography>
                </BlockTimeContainer>
            ) : null}
        </>
    );
}

export default BlockTime;
