import { BlockTimeContainer, TimerTypography, TitleTypography } from './BlockTime.styles';
import { useBlockInfo } from '@app/hooks/useBlockInfo.ts';
import { useCPUStatusStore } from '@app/store/useCPUStatusStore.ts';
import { useShallow } from 'zustand/react/shallow';

function BlockTime() {
    const isMining = useCPUStatusStore(useShallow((s) => s.is_mining));
    const timeSince = useBlockInfo();
    const { daysString, hoursString, minutes, seconds } = timeSince || {};

    return (
        <>
            {timeSince && isMining ? (
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
