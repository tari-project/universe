import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CountdownContainer, CountdownSquare, CountdownText, CountdownWrapper, Grid } from './Countdown.styles.ts';

interface CountdownTime {
    days: number;
    hours: number;
    minutes: number;
}
interface CountdownProps {
    isCurrent?: boolean;
    futureTime?: string;
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
            setCountdown({ days, hours, minutes });
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

export default function Countdown({ isCurrent = false, futureTime, onEndReached }: CountdownProps) {
    const { t } = useTranslation('airdrop');
    const countdown = useCountdown({ futureTime, callback: onEndReached });
    return countdown ? (
        <CountdownWrapper>
            <CountdownText>
                {isCurrent ? t('tranche.status.closes-prefix') : t('tranche.status.available-in')}
            </CountdownText>
            <CountdownContainer>
                <Grid>
                    {countdown.days > 0 && <CountdownSquare>{countdown.days}D</CountdownSquare>}
                    {(countdown.days > 0 || countdown.hours > 0) && (
                        <CountdownSquare>{countdown.hours}H</CountdownSquare>
                    )}
                    <CountdownSquare>{countdown.minutes}M</CountdownSquare>
                </Grid>
            </CountdownContainer>
            {isCurrent && <CountdownText>{t('tranche.status.closes-suffix')}</CountdownText>}
        </CountdownWrapper>
    ) : null;
}
