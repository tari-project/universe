import gem from '@app/assets/images/gem.png';
import gift from '@app/assets/images/gift.png';
import { useTranslation } from 'react-i18next';
import { useAirdropStore } from '@app/store';
import { formatNumber, FormatPreset } from '@app/utils';
import { useAvatarGradient } from '@app/hooks/airdrop/utils/useAvatarGradient.ts';
import { Action } from './components/Action.tsx';
import { ActionImgWrapper, GemImg, Wrapper, Avatar } from './Actions.style.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import LinkIcon from '@app/containers/main/Airdrop/AirdropGiftTracker/sections/LoggedIn/segments/Invite/LinkIcon.tsx';

export function Actions() {
    const { t } = useTranslation('airdrop');
    const userDetails = useAirdropStore((s) => s.userDetails);
    const gemCount = useAirdropStore((s) => s.userPoints?.base?.gems || 0);
    const formattedCount = formatNumber(gemCount, FormatPreset.COMPACT);

    const profileimageurl = userDetails?.user?.profileimageurl;
    const name = userDetails?.user?.name;

    const style = useAvatarGradient({ username: name || '', image: profileimageurl });

    const inviteTooltipContent = (
        <>
            <Typography variant="h6">{t('inviteFriends')}</Typography>
            <Typography variant="p">{t('inviteFriendsText')}</Typography>
        </>
    );
    const inviteHoverContent = (
        <>
            <LinkIcon />
        </>
    );

    return (
        <Wrapper>
            <Action text={t('invite')} tooltipContent={inviteTooltipContent} hoverContent={inviteHoverContent}>
                <ActionImgWrapper>
                    <img src={gift} alt="gift image" style={{ width: 32 }} />
                </ActionImgWrapper>
            </Action>
            <Action text={formattedCount}>
                <ActionImgWrapper>
                    <GemImg src={gem} alt="gem image" />
                </ActionImgWrapper>
            </Action>

            <Action>
                <Avatar style={style} />
            </Action>
        </Wrapper>
    );
}
