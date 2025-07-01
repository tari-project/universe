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

    const api = countdownRef.current?.getApi();

    const renderer = ({ hours, minutes, completed, api }) => {
        if (!api.isStarted()) {
            return t('setup-progresses:calculating_time', { context: isCompact && 'compact' });
        }
        return completed ? t('sync-message.completed') : `${hours}h ${minutes.toString().padStart(2, '0')}m`;
    };

    useEffect(() => {
        if (countdown > 0 && !api?.isStarted()) {
            api?.start();
        }
    }, [api, countdown]);

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
