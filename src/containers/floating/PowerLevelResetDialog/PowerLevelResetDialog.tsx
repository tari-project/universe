import { useUIStore } from '@app/store/useUIStore';

import { DialogContent, Dialog } from '@app/components/elements/dialog/Dialog';
import { useCallback, useEffect, useState } from 'react';
import { ButtonWrapper, CountdownNumber, KeepButton, RevertButton, Text, TextWrapper, Title, Wrapper } from './styles';
import { useTranslation } from 'react-i18next';
import { useMiningStore } from '@app/store/useMiningStore';

function Countdown({ onComplete }: { onComplete: () => void }) {
    const [count, setCount] = useState(30);

    useEffect(() => {
        if (count === 0) {
            onComplete();
            return;
        }
        const timer = setTimeout(() => setCount(count - 1), 1000);
        return () => clearTimeout(timer);
    }, [count, onComplete]);

    return <CountdownNumber>{count < 10 ? `0${count}` : count}</CountdownNumber>;
}

export default function PowerLevelResetDialog() {
    const { t } = useTranslation('components', { useSuspense: false });
    const open = useUIStore((s) => s.dialogToShow === 'powerLevelReset');
    const setDialogToShow = useUIStore((s) => s.setDialogToShow);
    const changeMiningMode = useMiningStore((s) => s.changeMiningMode);

    const handleClose = useCallback(() => {
        setDialogToShow(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleCountdownComplete = useCallback(() => {
        setDialogToShow(null);
    }, [setDialogToShow]);

    const handleChange = useCallback(async () => {
        await changeMiningMode({ mode: 'Ludicrous' });
    }, [changeMiningMode]);

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent>
                <Wrapper>
                    <TextWrapper>
                        <Title>{t('powerLevelResetDialog.title')}</Title>
                        <Text>
                            {t('powerLevelResetDialog.description')} <Countdown onComplete={handleCountdownComplete} />{' '}
                            {t('powerLevelResetDialog.seconds')}.
                        </Text>
                    </TextWrapper>
                    <ButtonWrapper>
                        <KeepButton onClick={handleChange}>
                            <span>🔥</span> {t('powerLevelResetDialog.keepChanges')}
                        </KeepButton>
                        <RevertButton onClick={handleClose}>{t('powerLevelResetDialog.revertToEco')}</RevertButton>
                    </ButtonWrapper>
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
}
