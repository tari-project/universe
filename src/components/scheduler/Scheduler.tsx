import { Typography } from '@app/components/elements/Typography.tsx';
import { TextButton } from '@app/components/elements/buttons/TextButton.tsx';
import { MiningMode } from '@app/components/mode/MiningMode.tsx';
import { TimePicker } from '@app/components/elements/inputs/time-picker/TimePicker.tsx';
import { CTA, FormWrapper, Text, Wrapper } from './styles.ts';

export default function Scheduler() {
    return (
        <Wrapper>
            <Typography variant="h1">{`Mining Schedule`}</Typography>
            <Text variant="p">{`Set specific times to automatically start mining.`}</Text>
            <FormWrapper>
                <TimePicker label={`Daily Start Time`} initialTime={{ hour: '06', minute: '00', cycle: 'AM' }} />
                <TimePicker label={`Daily End Time`} initialTime={{ hour: '04', minute: '30', cycle: 'PM' }} />
                <MiningMode variant="secondary" />
            </FormWrapper>
            <CTA variant="black" size="xlarge" fluid>{`Save schedule`}</CTA>
            <TextButton fluid>{`Cancel`}</TextButton>
        </Wrapper>
    );
}
