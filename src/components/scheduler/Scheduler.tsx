import { Typography } from '@app/components/elements/Typography.tsx';
import { TextButton } from '@app/components/elements/buttons/TextButton.tsx';
import { MiningMode } from '@app/components/mode/MiningMode.tsx';
import { TimePicker } from '@app/components/elements/inputs/time-picker/TimePicker.tsx';
import { ContentWrapper, CTA, CTAText, FormWrapper, Text, Wrapper } from './styles.ts';
import { useState } from 'react';
import { TimeParts } from '@app/components/elements/inputs/time-picker/types.ts';
import { setShowScheduler } from '@app/store/stores/useModalStore.ts';
import { invoke } from '@tauri-apps/api/core';
import { useConfigCoreStore } from '@app/store';

const INIT_START: TimeParts = { hour: '06', minute: '00', cycle: 'AM' };
const INIT_END: TimeParts = { hour: '04', minute: '30', cycle: 'PM' };

export default function Scheduler() {
    const _scheduler_events = useConfigCoreStore((s) => s.scheduler_events);

    const [startTime, setStartTime] = useState<TimeParts>(INIT_START);
    const [endTime, setEndTime] = useState<TimeParts>(INIT_END);

    function handleSave() {
        console.info('Saving schedule');
        //invoke

        const payload = {
            eventId: 'mining_schedule',
            startTimeHour: Number(startTime.hour),
            startTimeMinute: Number(startTime.minute),
            startTimePeriod: startTime.cycle,
            endTimeHour: Number(endTime.hour),
            endTimeMinute: Number(endTime.minute),
            endTimePeriod: endTime.cycle,
        };
        console.log(payload);
        invoke('add_scheduler_between_event', payload)
            .then(() => console.info('Saved!'))
            .catch(console.error);
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
