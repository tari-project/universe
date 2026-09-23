import { CircularProgress } from '@app/components/elements/CircularProgress';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog';
import { Stack } from '@app/components/elements/Stack';
import { Typography } from '@app/components/elements/Typography';
import { useErrorDialogsButtonsLogic } from '@app/hooks/app/useErrorDialogsButtonsLogic';
import { useAppStateStore } from '@app/store/appStateStore';

import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { ErrorText, TextWrapper, Wrapper } from './styles.ts';
import { setIsSettingsOpen } from '@app/store';

const CriticalProblemDialog = memo(function CriticalProblemDialog() {
    const { t } = useTranslation(['setup-progresses', 'common', 'settings'], { useSuspense: false });
    const criticalProblem = useAppStateStore((s) => s.criticalProblem);

    const { isExiting, handleClose, handleRestart } = useErrorDialogsButtonsLogic();

    return (
        <Dialog open={!!criticalProblem}>
            <DialogContent>
                <Wrapper>
                    <TextWrapper>
                        <Typography variant="h3">
                            {t(criticalProblem?.title || 'common:installation-problem')}
                        </Typography>
                        <ErrorText>{criticalProblem?.error_message}</ErrorText>
                        <Typography variant="p">
                            {t(criticalProblem?.description || 'common:installation-problem')}
                        </Typography>
                    </TextWrapper>
                    <Stack direction="row" justifyContent="center" gap={8}>
                        {isExiting ? (
                            <CircularProgress />
                        ) : (
                            <Stack direction="row" gap={8} justifyContent="space-between" style={{ width: '100%' }}>
                                <Button size="smaller" backgroundColor="info" onClick={() => setIsSettingsOpen(true)}>
                                    {t('settings:settings')}
                                </Button>
                                <Stack direction="row" gap={8} justifyContent="space-around">
                                    <Button backgroundColor="error" size="smaller" onClick={handleClose}>
                                        {t('close-tari-universe')}
                                    </Button>
                                    <Button backgroundColor="warning" size="smaller" onClick={handleRestart}>
                                        {t('restart')}
                                    </Button>
                                </Stack>
                            </Stack>
                        )}
                    </Stack>
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
});

export default CriticalProblemDialog;
