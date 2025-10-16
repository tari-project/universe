import { Typography } from '@app/components/elements/Typography.tsx';
import { FormWrapper, Text, Wrapper } from './styles.ts';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { TextButton } from '@app/components/elements/buttons/TextButton.tsx';
import { MiningMode } from '@app/components/mode/MiningMode.tsx';
import { TimePicker } from '@app/components/elements/inputs/time-picker/TimePicker.tsx';

export default function Scheduler() {
    return (
        <Wrapper>
            <Typography variant="h1">{`Mining Schedule`}</Typography>
            <Text variant="p">{`Set specific times to automatically start mining. Your miner must stay open for schedules to run. If you close Tari Universe while a schedule is active, it will minimize to your system tray instead.`}</Text>
            <FormWrapper>
                <TimePicker label={`Daily Start Time`} />
                <TimePicker label={`Daily End Time`} />
                <MiningMode variant="secondary" />
            </FormWrapper>
            <Button variant="black" size="xlarge" fluid>{`Save schedule`}</Button>
            <TextButton fluid size="large">{`Cancel`}</TextButton>
        </Wrapper>
    );
}
