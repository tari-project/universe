import { AnimatePresence } from 'motion/react';
import { memo, useEffect, useRef } from 'react';
import { useAppStateStore } from '@app/store/appStateStore';
import { CircularProgress } from '@app/components/elements/CircularProgress';
import { Text, Title, Wrapper, ProgressWrapper, TextWrapper } from './styles';
import { useTranslation } from 'react-i18next';
import { useMiningStore } from '@app/store/useMiningStore';
import { startMining, stopMining } from '@app/store/miningStoreActions';

const ResumeApplicationModal = memo(function ResumeApplicationModal() {
    const { t } = useTranslation('components');
    const isMiningInitiated = useMiningStore((s) => s.miningInitiated);
    const setMiningControlsEnabled = useMiningStore((s) => s.setMiningControlsEnabled);
    const appResumePayload = useAppStateStore((state) => state.appResumePayload);
    const showModal = appResumePayload?.is_resuming;
    const wasMiningInitiatedRef = useRef(isMiningInitiated);

    useEffect(() => {
        if (appResumePayload?.is_resuming) {
            setMiningControlsEnabled(false);
        }

        if (isMiningInitiated && appResumePayload?.is_resuming) {
            wasMiningInitiatedRef.current = true;
            stopMining();
        }

        if (wasMiningInitiatedRef.current && !appResumePayload?.is_resuming) {
            startMining();
        }
        if (!appResumePayload?.is_resuming) {
            wasMiningInitiatedRef.current = false;
        }
    }, [isMiningInitiated, appResumePayload?.is_resuming]);

    return (
        <AnimatePresence>
            {showModal && (
                <Wrapper>
                    <TextWrapper>
                        <Title>{t('resume-app-modal.title')}</Title>
                        <Text>{t(`resume-app-modal.${appResumePayload.title}`)}</Text>
                    </TextWrapper>
                    <ProgressWrapper>
                        <Title>
                            {appResumePayload.stage_progress}/{appResumePayload.stage_total}
                        </Title>
                        <CircularProgress />
                    </ProgressWrapper>
                </Wrapper>
            )}
        </AnimatePresence>
    );
});

export default ResumeApplicationModal;
