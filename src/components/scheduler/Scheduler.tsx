import { useState } from 'react';
import { TimeParts } from '@app/types/mining/schedule.ts';
import { SCHEDULER_EVENT_ID, useConfigCoreStore } from '@app/store/stores/config/useConfigCoreStore.ts';
import { getParsedBetweenTime } from '@app/store/selectors/config/core.ts';
import { setSchedulerEvents } from '@app/store/actions/config/core.ts';
import { setShowScheduler } from '@app/store/stores/useModalStore.ts';

import { MiningMode } from '../mode/MiningMode.tsx';
import { TextButton } from '../elements/buttons/TextButton.tsx';
import { TimePicker } from '../elements/inputs/time-picker/TimePicker.tsx';
import { Typography } from '../elements/Typography.tsx';

import { CurrentScheduleItem } from './schedule/CurrentScheduleItem.tsx';
import { ContentWrapper, CTA, CTAText, FormWrapper, Text, TextWrapper, Wrapper } from './styles.ts';

export default function Scheduler() {
    const storedTimes = useConfigCoreStore((s) => s.scheduler_events);
    const { start, end } = getParsedBetweenTime(storedTimes, SCHEDULER_EVENT_ID);
    const [startTime, setStartTime] = useState<TimeParts>(start);
    const [endTime, setEndTime] = useState<TimeParts>(end);

    async function handleSave() {
        await setSchedulerEvents({
            id: SCHEDULER_EVENT_ID,
            event_type: 'Mine',
            timing: {
                Between: {
                    start_hour: Number(startTime.hour),
                    start_minute: Number(startTime.minute),
                    start_period: startTime.timePeriod,
                    end_hour: Number(endTime.hour),
                    end_minute: Number(endTime.minute),
                    end_period: endTime.timePeriod,
                },
            },
        });
    }

    return (
        <Wrapper>
            <TextWrapper>
                <Typography variant="h1">{`Mining Schedule`}</Typography>
                <Text variant="p">{`Set specific times to automatically start mining.`}</Text>
            </TextWrapper>
            <ContentWrapper>
                <FormWrapper>
                    <TimePicker label={`Daily Start Time`} initialTime={startTime} handleOnChange={setStartTime} />
                    <TimePicker label={`Daily End Time`} initialTime={endTime} handleOnChange={setEndTime} />
                    <MiningMode variant="secondary" />
                </FormWrapper>
                <CurrentScheduleItem />
            </ContentWrapper>
            <ContentWrapper>
                <CTA variant="black" size="xlarge" fluid onClick={handleSave}>{`Save schedule`}</CTA>
                <TextButton fluid onClick={() => setShowScheduler(false)}>
                    <CTAText>{`Cancel`}</CTAText>
                </TextButton>
            </ContentWrapper>
        </Wrapper>
    );
}
