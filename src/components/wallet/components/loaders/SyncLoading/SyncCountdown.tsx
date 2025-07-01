import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Countdown from 'react-countdown';
import { useProgressCountdown } from '@app/containers/main/Sync/components/useProgressCountdown.ts';

interface SyncCountdownProps {
    onCompleted: () => void;
    onStarted: () => void;
    isCompact?: boolean;
}
export default function SyncCountdown({ onCompleted, onStarted, isCompact = false }: SyncCountdownProps) {
    const { t } = useTranslation(['wallet', 'setup-progresses']);
    const countdownRef = useRef<Countdown | null>(null);
    const { countdown } = useProgressCountdown();
    const date = new Date(countdown * 1000);

    const renderer = ({ hours, minutes, completed, api }) => {
        if (!api.isStarted()) {
            return t('setup-progresses:calculating_time', { context: isCompact && 'compact' });
        } else {
            const isComplete = completed && countdown !== -1 && countdown < 60;
            return isComplete ? t('sync-message.completed') : `${hours}h ${minutes.toString().padStart(2, '0')}m`;
        }
    };

    useEffect(() => {
        const api = countdownRef.current?.getApi();
        if (!api?.isStarted() && countdown !== -1) {
            api?.start();
        }
    }, [countdown]);

    return (
        <Countdown
            ref={countdownRef}
            controlled
            date={date}
            autoStart={false}
            renderer={renderer}
            onComplete={onCompleted}
            onStart={onStarted}
        />
    );
}
