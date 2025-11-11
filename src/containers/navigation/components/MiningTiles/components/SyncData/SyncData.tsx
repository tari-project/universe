import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrentPhaseDetails } from '@app/containers/main/Sync/components/useCurrentPhaseDetails.ts';
import SyncCountdown from '@app/components/wallet/components/loaders/SyncLoading/SyncCountdown.tsx';
import { CountdownText, Label, TextWrapper, Wrapper } from './styles.ts';

export default function SyncData() {
    const { t } = useTranslation(['setup-progresses', 'wallet']);
    const [isComplete, setIsComplete] = useState(false);
    const [isStarted, setIsStarted] = useState(false);
    const { setupPhaseTitle } = useCurrentPhaseDetails();

    const titleKey = setupPhaseTitle === 'setup-cpu-mining' ? 'setup-mining' : setupPhaseTitle;
    return (
        <Wrapper>
            <TextWrapper>
                <CountdownText>
                    <SyncCountdown
                        onStarted={() => setIsStarted(true)}
                        onCompleted={() => setIsComplete(true)}
                        isCompact
                    />
                    {isStarted && !isComplete && t('wallet:sync-message.line2')}
                </CountdownText>
                {titleKey && <Label>{t(`phase-title.${titleKey}`, { context: 'compact' })}</Label>}
            </TextWrapper>
        </Wrapper>
    );
}
