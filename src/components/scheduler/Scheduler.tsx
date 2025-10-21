import { Typography } from '@app/components/elements/Typography.tsx';
import { TextButton } from '@app/components/elements/buttons/TextButton.tsx';
import { MiningMode } from '@app/components/mode/MiningMode.tsx';
import { TimePicker } from '@app/components/elements/inputs/time-picker/TimePicker.tsx';
import { ContentWrapper, CTA, CTAText, FormWrapper, Text, Wrapper } from './styles.ts';
import { useState } from 'react';

import { setShowScheduler } from '@app/store/stores/useModalStore.ts';
import { TimeParts } from '@app/types/mining/schedule.ts';
import { useConfigCoreStore } from '@app/store/stores/config/useConfigCoreStore.ts';
import { setSchedulerEvents } from '@app/store/actions/config/core.ts';
import { getParsedBetweenTime } from '@app/store/selectors/config/core.ts';

const SCHEDULER_EVENT_ID = 'mining_schedule';

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
            <ContentWrapper>
                <Typography variant="h1">{`Mining Schedule`}</Typography>
                <Text variant="p">{`Set specific times to automatically start mining.`}</Text>
                <FormWrapper>
                    <TimePicker label={`Daily Start Time`} initialTime={startTime} handleOnChange={setStartTime} />
                    <TimePicker label={`Daily End Time`} initialTime={endTime} handleOnChange={setEndTime} />
                    <MiningMode variant="secondary" />
                </FormWrapper>
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
