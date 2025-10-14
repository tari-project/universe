import { StyledCTA } from './styles.ts';
import { CalendarSvg } from '@app/assets/icons/calendar.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import { setShowScheduler } from '@app/store/stores/useModalStore.ts';

export default function SetScheduleButton() {
    return (
        <StyledCTA onClick={() => setShowScheduler(true)}>
            <CalendarSvg />
            <Typography>{`Setup Mining Schedule`}</Typography>
        </StyledCTA>
    );
}
