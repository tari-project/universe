import { useEffect, useState, useTransition } from 'react';
import { SchedulerEventState, TimeParts } from '@app/types/mining/schedule.ts';
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
import { useTranslation } from 'react-i18next';

export default function Scheduler() {
    const { t } = useTranslation(['mining-view', 'common']);
    const storedTimes = useConfigCoreStore((s) => s.scheduler_events);
    const { start, end } = getParsedBetweenTime(storedTimes, SCHEDULER_EVENT_ID);
    const [startTime, setStartTime] = useState<TimeParts>(start);
    const [endTime, setEndTime] = useState<TimeParts>(end);
    const [saved, setSaved] = useState(false);

    const [isPending, startTransition] = useTransition();

    function handleSave() {
        startTransition(async () => {
            await setSchedulerEvents({
                id: SCHEDULER_EVENT_ID,
                event_type: { Mine: { mining_mode: 'Eco' } },
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
                state: SchedulerEventState.Active,
            });
            setSaved(true);
        });
    }

    useEffect(() => {
        if (saved && !isPending) {
            const savedTimeout = setTimeout(() => setSaved(false), 1000);
            return () => clearTimeout(savedTimeout);
        }
    }, [saved, isPending]);

    return (
        <Wrapper>
            <TextWrapper>
                <Typography variant="h1">{t('schedule.mining-schedule')}</Typography>
                <Text variant="p">{t('schedule.mining-schedule-copy')}</Text>
            </TextWrapper>
            <ContentWrapper>
                <FormWrapper>
                    <TimePicker
                        label={t('schedule.time-label', { context: 'start' })}
                        initialTime={startTime}
                        handleOnChange={setStartTime}
                    />
                    <TimePicker
                        label={t('schedule.time-label', { context: 'end' })}
                        initialTime={endTime}
                        handleOnChange={setEndTime}
                    />
                    <MiningMode variant="secondary" />
                </FormWrapper>
                <CurrentScheduleItem />
            </ContentWrapper>
            <ContentWrapper>
                <CTA variant="black" size="xlarge" fluid onClick={handleSave} disabled={isPending}>
                    {t('schedule.cta-save', { context: saved ? 'complete' : '' })}
                </CTA>
                <TextButton fluid onClick={() => setShowScheduler(false)}>
                    <CTAText>{t('common:cancel')}</CTAText>
                </TextButton>
            </ContentWrapper>
        </Wrapper>
    );
}
