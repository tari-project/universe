import { FaRegTrashCan } from 'react-icons/fa6';

import { TimeParts } from '@app/types/mining/schedule.ts';
import { fmtTimeUnit } from '@app/utils';
import { SCHEDULER_EVENT_ID, useConfigCoreStore } from '@app/store/stores/config/useConfigCoreStore.ts';
import { removeSchedulerEvent } from '@app/store/actions/config/core.ts';
import { getParsedBetweenTime } from '@app/store/selectors/config/core.ts';

import { IconButton } from '@app/components/elements/buttons/IconButton.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';

import { Content, CurrentWrapper, TextWrapper } from './styles.ts';
import { AnimatePresence } from 'motion/react';

function fmtTime(t: TimeParts) {
    return `${fmtTimeUnit(t.hour)}:${fmtTimeUnit(t.minute)} ${t.timePeriod}`;
}
export function CurrentScheduleItem() {
    const storedTimes = useConfigCoreStore((s) => s.scheduler_events);
    const { start, end } = getParsedBetweenTime(storedTimes, SCHEDULER_EVENT_ID);

    const hasShedule = storedTimes !== null && storedTimes && Object.keys(storedTimes)?.length > 0;

    return (
        <CurrentWrapper>
            <AnimatePresence>
                {hasShedule && (
                    <Content initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <TextWrapper>
                            <Typography variant="p">{`Your current schedule: `}</Typography>
                            <Typography>
                                <strong>{`${fmtTime(start)} - ${fmtTime(end)}`}</strong>
                            </Typography>
                        </TextWrapper>
                        <IconButton size="small" onClick={() => removeSchedulerEvent(SCHEDULER_EVENT_ID)}>
                            <FaRegTrashCan />
                        </IconButton>
                    </Content>
                )}
            </AnimatePresence>
        </CurrentWrapper>
    );
}
