import { Typography } from '@app/components/elements/Typography.tsx';
import { FormWrapper, Text, Wrapper } from './styles.ts';
import { TimePicker } from '@app/components/elements/inputs/time-picker/TimePicker.tsx';
import ModeDropdown from '@app/containers/navigation/components/MiningButtonCombined/MiningButton/components/ModeDropdown/ModeDropdown.tsx';

export default function Scheduler() {
    return (
        <Wrapper>
            <Typography variant="h1">{`Mining Schedule`}</Typography>
            <Text variant="p">{`Set specific times to automatically start mining. Your miner must stay open for schedules to run. If you close Tari Universe while a schedule is active, it will minimize to your system tray instead.`}</Text>
            <FormWrapper>
                <TimePicker label={`Daily Start Time`} />
                <TimePicker label={`Daily End Time`} />
                <ModeDropdown />
            </FormWrapper>
        </Wrapper>
    );
}
