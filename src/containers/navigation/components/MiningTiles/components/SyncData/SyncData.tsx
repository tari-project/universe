import { CountdownText, Label, TextWrapper, Wrapper } from './styles.ts';
import { useProgressCountdown } from '@app/containers/main/Sync/components/useProgressCountdown.ts';

import { useCurrentPhaseDetails } from '@app/containers/main/Sync/components/useCurrentPhaseDetails.ts';
import { useTranslation } from 'react-i18next';

export default function SyncData() {
    const { t } = useTranslation(['setup-progresses', 'wallet']);
    const { countdownText } = useProgressCountdown();
    const { setupPhaseTitle } = useCurrentPhaseDetails();
    return (
        <Wrapper>
            <TextWrapper>
                <CountdownText>{countdownText}</CountdownText>
                <Label>{t(`phase-title.${setupPhaseTitle}`, { context: 'compact' })}</Label>
            </TextWrapper>
        </Wrapper>
    );
}
