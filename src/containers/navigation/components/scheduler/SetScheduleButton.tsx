import { CalendarWrapper, Content, StyledCTA, TimeWrapper, Wrapper } from './styles.ts';
import { CalendarSvg } from '@app/assets/icons/calendar.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import { setShowScheduler } from '@app/store/stores/useModalStore.ts';
import { useTranslation } from 'react-i18next';
import { SCHEDULER_EVENT_ID, useConfigCoreStore } from '@app/store/stores/config/useConfigCoreStore.ts';
import { getParsedBetweenTime, getScheduleItem } from '@app/store/selectors/config/core.ts';
import { useMiningMetricsStore } from '@app/store';
import { fmtTimePartString } from '@app/utils';
import { ToggleSwitch } from '@app/components/elements/inputs/switch/ToggleSwitch.tsx';
import { TbClockHour4Filled } from 'react-icons/tb';
import { toggleSchedulerEventPaused } from '@app/store/actions/config/core.ts';
import { useTransition } from 'react';
import { SchedulerEventState } from '@app/types/mining/schedule.ts';

export default function SetScheduleButton() {
    const { t } = useTranslation('mining-view');
    const storedTimes = useConfigCoreStore((s) => s.scheduler_events);
    const cpuIsMining = useMiningMetricsStore((s) => s.cpu_mining_status?.is_mining);
    const gpuIsMining = useMiningMetricsStore((s) => s.gpu_mining_status?.is_mining);

    const { start, end } = getParsedBetweenTime(storedTimes, SCHEDULER_EVENT_ID);
    const eventDetails = getScheduleItem(storedTimes, SCHEDULER_EVENT_ID);

    const [isPending, startTransition] = useTransition();

    function handlePauseToggle() {
        startTransition(async () => {
            await toggleSchedulerEventPaused(SCHEDULER_EVENT_ID);
        });
    }

    const isMining = cpuIsMining || gpuIsMining;
    const hasSchedule = storedTimes !== null && storedTimes && Object.keys(storedTimes)?.length > 0;

    const labelMarkup = hasSchedule ? (
        <Typography>{t('schedule.scheduled-to', { context: isMining ? 'pause' : 'mine' })}</Typography>
    ) : (
        <Typography>{t('schedule.mining-schedule-setup')}</Typography>
    );

    const timeMarkup = hasSchedule ? (
        <TimeWrapper>
            <TbClockHour4Filled size={11} />
            <strong>{fmtTimePartString(isMining ? end : start)}</strong>
        </TimeWrapper>
    ) : null;

    const toggleMarkup = hasSchedule ? (
        <ToggleSwitch
            checked={eventDetails?.state !== SchedulerEventState.Paused}
            onChange={handlePauseToggle}
            disabled={isPending}
        />
    ) : null;
    return (
        <Wrapper>
            <StyledCTA onClick={() => setShowScheduler(true)} $hasSchedule={hasSchedule}>
                <Content>
                    <CalendarWrapper>
                        <CalendarSvg />
                    </CalendarWrapper>
                    {labelMarkup}
                    {timeMarkup}
                </Content>
            </StyledCTA>
            {toggleMarkup}
        </Wrapper>
    );
}
