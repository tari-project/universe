import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CountdownText, CountdownWrapper } from './Countdown.styles.ts';

interface CountdownTime {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}
interface CountdownProps {
    isCurrent?: boolean;
    futureTime?: string;
    compact?: boolean;
    onEndReached?: () => void;
}

function useCountdown({ futureTime, callback }: CountdownProps & { callback?: () => void }) {
    const initialCountdownRef = useRef(false);
    const [countdown, setCountdown] = useState<CountdownTime | null>(null);

    const getCountdownParts = useCallback(() => {
        if (!futureTime) return;
        const now = new Date().getTime();
        const futureTimeMs = new Date(futureTime).getTime();

        const timeDiff = futureTimeMs - now;

        if (timeDiff <= 0) {
            setCountdown(null);
            console.debug('Future tranche should now be available, refreshing data');
            callback?.();
            return;
        }

        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

        return { days, hours, minutes };
    }, [callback, futureTime]);

    const updateCountdown = useCallback(() => {
        const parts = getCountdownParts();
        if (parts) {
            const { days, hours, minutes } = parts || {};
            setCountdown({ days, hours, minutes, seconds: 0 });
            initialCountdownRef.current = true;
        }
    }, [getCountdownParts]);

    useEffect(() => {
        if (countdown || initialCountdownRef.current) return;
        updateCountdown();
    }, [countdown, updateCountdown]);

    useEffect(() => {
        const interval = setInterval(updateCountdown, 1000 * 55);
        return () => clearInterval(interval);
    }, [updateCountdown]);

    return countdown;
}

export default function Countdown({ isCurrent = false, compact = false, futureTime, onEndReached }: CountdownProps) {
    const { t } = useTranslation('airdrop');
    const countdown = useCountdown({ futureTime, callback: onEndReached });
    return countdown ? (
        <CountdownWrapper $compact={compact}>
            <CountdownText $compact={compact}>
                {isCurrent
                    ? t('tranche.status.closes-prefix')
                    : t('tranche.status.available-in', { context: compact && 'compact' })}
            </CountdownText>
            <CountdownText $compact={compact}>
                <strong>
                    {countdown.days > 0 && ` ${countdown.days}D`}
                    {(countdown.days > 0 || countdown.hours > 0) && ` ${countdown.hours}H`}
                    {` ${countdown.minutes}M`}
                </strong>
                {!compact && `.`}
            </CountdownText>
            <CountdownText $compact={compact}>
                {isCurrent && !compact && t('tranche.status.closes-suffix')}
            </CountdownText>
        </CountdownWrapper>
    ) : null;
}
