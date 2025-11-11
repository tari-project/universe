import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Countdown from 'react-countdown';
import { useProgressCountdown } from '@app/containers/main/Sync/components/useProgressCountdown.ts';
import LoadingText from '@app/components/elements/loaders/LoadingText/LoadingText';

interface SyncCountdownProps {
    onCompleted: () => void;
    onStarted: () => void;
    isCompact?: boolean;
}
export default function SyncCountdown({ onCompleted, onStarted, isCompact = false }: SyncCountdownProps) {
    const { t } = useTranslation(['wallet', 'setup-progresses']);
    const startedRef = useRef(false);
    const countdownRef = useRef<Countdown | null>(null);
    const { countdown } = useProgressCountdown(isCompact);
    const date = new Date(countdown * 1000);

    const renderer = useMemo(
        () =>
            ({ hours, minutes, completed }) => {
                const isComplete = completed || countdown < 80;
                if (startedRef.current) {
                    return isComplete ? t('sync-message.completed') : `${hours > 0 ? hours + `h` : ''} ${minutes}m`;
                } else {
                    return t('setup-progresses:calculating_time', { context: isCompact && 'compact' });
                }
            },
        [countdown, isCompact, t]
    );

    useEffect(() => {
        const api = countdownRef.current?.getApi();
        if (!api?.isStarted() && countdown !== -1) {
            api?.start();
            startedRef.current = true;
        }

        if (startedRef.current && countdown < 80) {
            api?.stop();
        }
    }, [countdown]);

    if (!startedRef.current) {
        return <LoadingText text={t('setup-progresses:calculating_time', { context: isCompact && 'compact' })} />;
    }

    return (
        <Countdown
            ref={countdownRef}
            controlled
            date={date}
            autoStart={false}
            renderer={renderer}
            onStart={onStarted}
            onComplete={onCompleted}
            onStop={onCompleted}
        />
    );
}
