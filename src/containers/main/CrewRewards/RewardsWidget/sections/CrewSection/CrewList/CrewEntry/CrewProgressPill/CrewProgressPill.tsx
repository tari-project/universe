import { TimeRemaining } from '../../../data';
import NudgeIcon from './NudgeIcon';
import { ClaimButton, NudgeButton, TimePill } from './styles';
import { useTranslation } from 'react-i18next';

interface Props {
    canClaim: boolean;
    canNudge: boolean;
    timeRemaining: TimeRemaining;
    claimAmount: number;
    onClaim: () => void;
    onNudge: () => void;
    isClaimed: boolean;
}

export default function CrewProgressPill({
    canClaim,
    canNudge,
    timeRemaining,
    claimAmount,
    onClaim,
    onNudge,
    isClaimed,
}: Props) {
    const { t } = useTranslation();
    const { current, total, unit } = timeRemaining;

    if (isClaimed) {
        return <TimePill>{t('airdrop:crewRewards.actions.claimed')}</TimePill>;
    }

    if (canClaim) {
        return (
            <ClaimButton onClick={onClaim}>
                {t('airdrop:crewRewards.actions.claim', { amount: claimAmount })}
            </ClaimButton>
        );
    }

    if (canNudge) {
        return (
            <NudgeButton onClick={onNudge}>
                <NudgeIcon />
                {t('airdrop:crewRewards.actions.nudge')}
            </NudgeButton>
        );
    }

    return (
        <TimePill>
            {current}
            <span>
                /{total} {unit}
            </span>
        </TimePill>
    );
}
