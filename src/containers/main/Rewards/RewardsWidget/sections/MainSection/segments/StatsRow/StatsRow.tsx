import { useCrewMembers } from '@app/hooks/crew/useCrewMembers';
import { useReferrerProgress } from '@app/hooks/crew/useReferrerProgress';
import {
    Wrapper,
    ActiveMinersWrapper,
    PhotoWrapper,
    PhotoImage,
    StatusDot,
    TextWrapper,
    MainText,
    LabelText,
    Divider,
} from './styles';

import photo1 from '../../../../../images/person1.png';

export default function StatsRow() {
    const { data: crewData, isLoading: crewLoading } = useCrewMembers();
    const { referrerProgress, isLoading: progressLoading } = useReferrerProgress();

    // Calculate active miners from totals
    const activeMiners = crewData?.totals?.active || 0;
    const totalMiners = crewData?.totals?.all || 0;

    // Get bonus XTM earned from referrer progress
    const bonusXTMEarned = referrerProgress?.totalClaimedRewards || 0;

    // Format the bonus amount for display
    const formatBonusAmount = (amount: number) => {
        if (amount >= 1000) {
            return `${(amount / 1000).toFixed(1)}k`;
        }
        return amount.toLocaleString();
    };

    if (crewLoading || progressLoading) {
        return (
            <Wrapper>
                <ActiveMinersWrapper>
                    <PhotoWrapper>
                        <PhotoImage src={photo1} alt="" aria-hidden="true" />
                        <PhotoImage src={photo1} alt="" aria-hidden="true" />
                        <PhotoImage src={photo1} alt="" aria-hidden="true" />
                        <StatusDot />
                    </PhotoWrapper>

                    <TextWrapper>
                        <MainText>
                            -- <span>{`of --`}</span>
                        </MainText>
                        <LabelText>{`Active Miners`}</LabelText>
                    </TextWrapper>
                </ActiveMinersWrapper>

                <Divider />

                <TextWrapper>
                    <MainText>--</MainText>
                    <LabelText>{`Bonus XTM Earned`}</LabelText>
                </TextWrapper>
            </Wrapper>
        );
    }

    return (
        <Wrapper>
            <ActiveMinersWrapper>
                <PhotoWrapper>
                    <PhotoImage src={photo1} alt="" aria-hidden="true" />
                    <PhotoImage src={photo1} alt="" aria-hidden="true" />
                    <PhotoImage src={photo1} alt="" aria-hidden="true" />
                    <StatusDot />
                </PhotoWrapper>

                <TextWrapper>
                    <MainText>
                        {activeMiners} <span>{`of ${totalMiners}`}</span>
                    </MainText>
                    <LabelText>{`Active Miners`}</LabelText>
                </TextWrapper>
            </ActiveMinersWrapper>

            <Divider />

            <TextWrapper>
                <MainText>{formatBonusAmount(bonusXTMEarned)}</MainText>
                <LabelText>{`Bonus XTM Earned`}</LabelText>
            </TextWrapper>
        </Wrapper>
    );
}
