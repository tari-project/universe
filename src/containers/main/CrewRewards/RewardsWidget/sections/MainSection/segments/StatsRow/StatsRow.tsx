import Avatar from '@app/components/elements/Avatar/Avatar';
import {
    Wrapper,
    ActiveMinersWrapper,
    PhotosRow,
    TextWrapper,
    MainText,
    LabelText,
    Divider,
    InviteFriendsMessage,
    LoadingPlaceholder,
    PhotoWrapper,
    OnlineIndicator,
} from './styles';

import { useReferrerProgress } from '@app/hooks/crew/useReferrerProgress';
import { formatNumber, FormatPreset } from '@app/utils';
import { useTranslation, Trans } from 'react-i18next';
import AvatarInviteButton from './AvatarInviteButton/AvatarInviteButton';
import { useCrewRewardsStore } from '@app/store/useCrewRewardsStore';

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

    const { setIsOpen } = useCrewRewardsStore();

    const handleCrewToggle = () => {
        setIsOpen(true);
    };

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
                    <PhotosRow>
                        {totalFriends < 3 &&
                            Array.from({ length: 3 - totalFriends }).map((_, index) => (
                                <PhotoWrapper key={`${index}-invitebutton`} $isInviteButton={true}>
                                    <AvatarInviteButton />
                                </PhotoWrapper>
                            ))}
                        {crewData?.members.map(({ image, displayName, isCurrentlyMining, lastActivityDate }, index) => {
                            const lastActivityMoreThan1Hour =
                                Date.now() - new Date(lastActivityDate).getTime() > 1000 * 60 * 60;
                            const isOnline = !lastActivityMoreThan1Hour && !!isCurrentlyMining;
                            return (
                                <PhotoWrapper key={`${index}-crewminiavatar`} onClick={handleCrewToggle}>
                                    {isCurrentlyMining && <OnlineIndicator $isOnline={isOnline} />}
                                    <Avatar image={image} username={displayName} size={28} />
                                </PhotoWrapper>
                            );
                        })}
                    </PhotosRow>

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
