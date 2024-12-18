import { useTranslation } from 'react-i18next';
import { Label, Number, NumberGroup, SectionLabel, TimerColumn, TopBar, Wrapper } from './styles';
import { useShellOfSecretsStore } from '@app/store/useShellOfSecretsStore';
import { useEffect, useState } from 'react';

const padTime = (time: number) => String(time).padStart(2, '0');

export default function MainTimer() {
    const { t } = useTranslation('sos', { useSuspense: false });

    const { getTimeRemaining } = useShellOfSecretsStore();
    const [reminingTime, setRemainingTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        const intervalId = setInterval(() => {
            setRemainingTime(getTimeRemaining());
        }, 1000);
        return () => {
            clearInterval(intervalId);
        };
    }, [getTimeRemaining]);

    return (
        <Wrapper>
            <TopBar>
                <SectionLabel>{t('mainTimer.title')}</SectionLabel>
            </TopBar>

            <TimerColumn>
                <NumberGroup>
                    <Number>{padTime(reminingTime.days)}</Number>
                    <Label>{t('mainTimer.days')}</Label>
                </NumberGroup>

                <NumberGroup>
                    <Number>{padTime(reminingTime.hours)}</Number>
                    <Label>{t('mainTimer.hours')}</Label>
                </NumberGroup>

                <NumberGroup>
                    <Number>{padTime(reminingTime.minutes)}</Number>
                    <Label>{t('mainTimer.minutes')}</Label>
                </NumberGroup>

                <NumberGroup
                    style={{
                        opacity: 0.5,
                    }}
                >
                    <Number>{padTime(reminingTime.seconds)}</Number>
                    <Label>{t('mainTimer.seconds')}</Label>
                </NumberGroup>
            </TimerColumn>
        </Wrapper>
    );
}
