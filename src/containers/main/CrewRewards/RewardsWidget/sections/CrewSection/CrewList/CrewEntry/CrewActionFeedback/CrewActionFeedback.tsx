import { AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import NudgeIcon from '../CrewProgressPill/NudgeIcon';
import { InsideText, Wrapper } from './styles';
import { useEffect } from 'react';

interface Props {
    showNudge: boolean;
    setShowNudge: (showNudge: boolean) => void;
    showClaim: boolean;
    setShowClaim: (showClaim: boolean) => void;
    toggleViewTimeOut?: number;
}

const animation = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 },
};

const textAnimation = {
    initial: { scale: 0.5 },
    animate: { scale: 1 },
    exit: { scale: 1 },
};

export default function CrewActionFeedback({
    showNudge,
    setShowNudge,
    showClaim,
    setShowClaim,
    toggleViewTimeOut = 3000,
}: Props) {
    const { t } = useTranslation('airdrop', { keyPrefix: 'crewRewards.feedback' });

    useEffect(() => {
        if (showNudge) {
            const timer = setTimeout(() => {
                setShowNudge(false);
            }, toggleViewTimeOut);

            return () => clearTimeout(timer);
        }
    }, [showNudge, setShowNudge, toggleViewTimeOut]);

    useEffect(() => {
        if (showClaim) {
            const timer = setTimeout(() => {
                setShowClaim(false);
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [showClaim, setShowClaim, toggleViewTimeOut]);

    return (
        <AnimatePresence>
            {showNudge && (
                <Wrapper {...animation} $isNudge onClick={() => setShowNudge(false)}>
                    <InsideText {...textAnimation}>
                        <NudgeIcon /> {t('nudgeSent')}
                    </InsideText>
                </Wrapper>
            )}
            {showClaim && (
                <Wrapper {...animation} onClick={() => setShowClaim(false)}>
                    <InsideText {...textAnimation}>{t('rewardClaimed')}</InsideText>
                </Wrapper>
            )}
        </AnimatePresence>
    );
}
