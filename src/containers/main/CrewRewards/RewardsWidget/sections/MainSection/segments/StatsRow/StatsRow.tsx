import {
    Wrapper,
    ActiveMinersWrapper,
    PhotoWrapper,
    PhotoImage,
    TextWrapper,
    MainText,
    LabelText,
    Divider,
    InviteFriendsMessage,
    LoadingPlaceholder,
} from './styles';

import { useReferrerProgress } from '@app/hooks/crew/useReferrerProgress';
import { formatNumber, FormatPreset } from '@app/utils';
import { useTranslation, Trans } from 'react-i18next';

export default function StatsRow() {
    const { t } = useTranslation();

    const { data: crewData, isLoading: crewLoading, error: crewError } = useReferrerProgress();
    const referrerProgress = crewData?.referrerProgress;

    const totalFriends = crewData?.totals?.all || 0;
    const activeFriends = crewData?.totals?.active || 0;
    const bonusXTMEarned = (referrerProgress?.totalClaimedRewards || 0) * 1000000;

    const isLoading = crewLoading || crewLoading;
    const hasError = !!crewError;
    const hasFriends = totalFriends > 0;

    if (isLoading) {
        return (
            <Wrapper>
                <LoadingPlaceholder />
            </Wrapper>
        );
    }

    if (hasError) {
        return (
            <Wrapper>
                <InviteFriendsMessage>
                    <Trans i18nKey="airdrop:crewRewards.errorLoadingData" />
                </InviteFriendsMessage>
            </Wrapper>
        );
    }

    return (
        <Wrapper>
            {hasFriends ? (
                <ActiveMinersWrapper>
                    <PhotoWrapper>
                        {crewData?.memberImages.map((image) => (
                            <PhotoImage $image={image} key={image} />
                        ))}
                    </PhotoWrapper>

                    <TextWrapper>
                        <MainText>
                            {activeFriends}{' '}
                            <span>
                                {t('airdrop:crewRewards.of')} {totalFriends}
                            </span>
                        </MainText>
                        <LabelText>{t('airdrop:crewRewards.activeMinersStat')}</LabelText>
                    </TextWrapper>
                </ActiveMinersWrapper>
            ) : (
                <InviteFriendsMessage>
                    <Trans i18nKey="airdrop:crewRewards.inviteFriendsMessage" />
                </InviteFriendsMessage>
            )}

            <Divider />

            <TextWrapper>
                <MainText>{formatNumber(bonusXTMEarned, FormatPreset.XTM_LONG_DEC)}</MainText>
                <LabelText>{t('airdrop:crewRewards.bonusXTMEarned')}</LabelText>
            </TextWrapper>
        </Wrapper>
    );
}
