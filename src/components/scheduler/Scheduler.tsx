import { Typography } from '@app/components/elements/Typography.tsx';
import { TextButton } from '@app/components/elements/buttons/TextButton.tsx';
import { MiningMode } from '@app/components/mode/MiningMode.tsx';
import { TimePicker } from '@app/components/elements/inputs/time-picker/TimePicker.tsx';
import { ContentWrapper, CTA, CTAText, FormWrapper, Text, Wrapper } from './styles.ts';
import { useState } from 'react';

import { setShowScheduler } from '@app/store/stores/useModalStore.ts';
import { invoke } from '@tauri-apps/api/core';
import { TimeParts } from '@app/types/mining/schedule.ts';
import { useConfigCoreStore } from '@app/store/stores/config/useConfigCoreStore.ts';
import { setSchedulerEvents } from '@app/store/actions/config/core.ts';

const INIT_START: TimeParts = { hour: '06', minute: '00', timePeriod: 'AM' };
const INIT_END: TimeParts = { hour: '04', minute: '30', timePeriod: 'PM' };

export default function Scheduler() {
    const storedTimes = useConfigCoreStore((s) => s.scheduler_events);

    console.log(JSON.stringify(storedTimes, null, 2));

    const [startTime, setStartTime] = useState<TimeParts>(INIT_START);
    const [endTime, setEndTime] = useState<TimeParts>(INIT_END);

    async function handleSave() {
        console.info('Saving schedule');

        await setSchedulerEvents({
            id: 'mining_schedule',
            event_type: 'Mine',
            timing: {
                Between: {
                    start_period: startTime.timePeriod,
                    start_hour: Number(startTime.hour),
                    start_minute: Number(startTime.minute),
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
