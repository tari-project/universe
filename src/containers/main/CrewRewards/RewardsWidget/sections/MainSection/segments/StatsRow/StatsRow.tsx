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
    InviteFriendsMessage,
} from './styles';

import photo1 from '../../../../../images/person1.png';
import { useCrewRewardsStore } from '@app/store/useCrewRewardsStore';
import { formatNumber, FormatPreset } from '@app/utils';
import { useTranslation, Trans } from 'react-i18next';

export default function StatsRow() {
    const { t } = useTranslation();
    const totalFriends = useCrewRewardsStore((s) => s.totalFriends);
    const activeFriends = useCrewRewardsStore((s) => s.activeFriends);
    const bonusXTMEarned = useCrewRewardsStore((s) => s.bonusXTMEarned);
    const hasFriends = totalFriends > 0;

    return (
        <Wrapper>
            {hasFriends ? (
                <ActiveMinersWrapper>
                    <PhotoWrapper>
                        <PhotoImage $image={photo1} aria-hidden="true" />
                        <PhotoImage $image={photo1} aria-hidden="true" />
                        <PhotoImage $image={photo1} aria-hidden="true" />
                        <StatusDot />
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
