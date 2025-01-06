/* eslint-disable i18next/no-literal-string */

import { useUIStore } from '@app/store/useUIStore';

import { DialogContent, Dialog } from '@app/components/elements/dialog/Dialog';
import { useCallback, useEffect, useState } from 'react';
import { ButtonWrapper, CountdownNumber, KeepButton, RevertButton, Text, TextWrapper, Title, Wrapper } from './styles';

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
    const open = useUIStore((s) => s.dialogToShow === 'powerLevelReset');
    const setDialogToShow = useUIStore((s) => s.setDialogToShow);

    const handleClose = useCallback(() => {
        setDialogToShow(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleCountdownComplete = useCallback(() => {
        setDialogToShow(null);
    }, [setDialogToShow]);

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent>
                <Wrapper>
                    <TextWrapper>
                        <Title>Stay in Ludicrous Mode?</Title>
                        <Text>
                            Ludicrous mode may make your system unresponsive. Please confirm you want to start mining in
                            Ludicrous mode or Tari Universe will switch back to Eco mode in{' '}
                            <Countdown onComplete={handleCountdownComplete} /> seconds.
                        </Text>
                    </TextWrapper>
                    <ButtonWrapper>
                        <KeepButton>
                            <span>🔥</span> Keep Changes
                        </KeepButton>
                        <RevertButton>Revert to ECO</RevertButton>
                    </ButtonWrapper>
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
}
