import { useTranslation } from 'react-i18next';
import {
    Label,
    LineBottom,
    LineLeft,
    LineRight,
    Number,
    NumberGroup,
    SectionLabel,
    TimerColumn,
    TopBar,
    Wrapper,
} from './styles';
import { useShellOfSecretsStore } from '@app/store/useShellOfSecretsStore';
import { useEffect, useState } from 'react';

export default function MainTimer() {
    const { t } = useTranslation('sos', { useSuspense: false });

    const { getTimeRemaining, totalBonusTimeMs } = useShellOfSecretsStore();
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
                <LineLeft />
                <SectionLabel>{t('mainTimer.title')}</SectionLabel>
                <LineRight />
            </TopBar>

            <TimerColumn>
                <NumberGroup>
                    <Number>{reminingTime.days}</Number>
                    <Label>{t('mainTimer.days')}</Label>
                </NumberGroup>

                <NumberGroup>
                    <Number>{reminingTime.hours}</Number>
                    <Label>{t('mainTimer.hours')}</Label>
                </NumberGroup>

                <NumberGroup>
                    <Number>{reminingTime.minutes}</Number>
                    <Label>{t('mainTimer.minutes')}</Label>
                </NumberGroup>

                <NumberGroup
                    style={{
                        opacity: 0.5,
                    }}
                >
                    <Number>{reminingTime.seconds}</Number>
                    <Label>{t('mainTimer.seconds')}</Label>
                </NumberGroup>

                <LineBottom />
            </TimerColumn>
        </Wrapper>
    );
}
