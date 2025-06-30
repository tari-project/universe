import { CountdownText, Label, TextWrapper, Wrapper } from './styles.ts';
import { useProgressCountdown } from '@app/containers/main/Sync/components/useProgressCountdown.ts';

import { useCurrentPhaseDetails } from '@app/containers/main/Sync/components/useCurrentPhaseDetails.ts';
import { useTranslation } from 'react-i18next';
import Countdown from 'react-countdown';

export default function SyncData() {
    const { t } = useTranslation(['setup-progresses', 'wallet']);
    const { countdown } = useProgressCountdown();
    const { setupPhaseTitle } = useCurrentPhaseDetails();
    const date = new Date(Date.now() + countdown * 1000);
    return (
        <Wrapper>
            <TextWrapper>
                <CountdownText>
                    <Countdown
                        date={date}
                        renderer={({ hours, minutes, completed }) =>
                            completed ? t('calculating_time') : `${hours}h ${minutes.toString().padStart(2, '0')}m`
                        }
                    />
                    {countdown > 0 && t('wallet:sync-message.line2')}
                </CountdownText>
                <Label>{t(`phase-title.${setupPhaseTitle}`, { context: 'compact' })}</Label>
            </TextWrapper>
        </Wrapper>
    );
}
