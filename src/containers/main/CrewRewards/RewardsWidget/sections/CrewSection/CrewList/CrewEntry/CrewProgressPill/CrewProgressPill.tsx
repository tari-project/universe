import { TimeRemaining } from '../../../data';
import NudgeIcon from './NudgeIcon';
import { ClaimButton, NudgeButton, TimePill } from './styles';

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
    const { current, total, unit } = timeRemaining;

    if (isClaimed) {
        return <TimePill>{`Claimed`}</TimePill>;
    }

    if (canClaim) {
        return <ClaimButton onClick={onClaim}>{`Claim ${claimAmount} XTM`}</ClaimButton>;
    }

    if (canNudge) {
        return (
            <NudgeButton onClick={onNudge}>
                <NudgeIcon />
                {`Nudge`}
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
