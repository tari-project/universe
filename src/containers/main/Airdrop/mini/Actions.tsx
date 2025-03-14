import gem from '@app/assets/images/gem.png';
import gift from '@app/assets/images/gift.png';
import { useTranslation } from 'react-i18next';
import { useAirdropStore } from '@app/store';
import { formatNumber, FormatPreset } from '@app/utils';
import { useAvatarGradient } from '@app/hooks/airdrop/utils/useAvatarGradient.ts';
import { Action } from './components/Action.tsx';
import { ActionImgWrapper, GemImg, Wrapper, Avatar } from './Actions.style.ts';

export function Actions() {
    const { t } = useTranslation('airdrop');
    const userDetails = useAirdropStore((s) => s.userDetails);
    const gemCount = useAirdropStore((s) => s.userPoints?.base?.gems || 0);
    const formattedCount = formatNumber(gemCount, FormatPreset.COMPACT);

    const profileimageurl = userDetails?.user?.profileimageurl;
    const name = userDetails?.user?.name;

    const style = useAvatarGradient({ username: name || '', image: profileimageurl });

    return (
        <Wrapper>
            <Action text={t('invite')}>
                <ActionImgWrapper>
                    <img src={gift} alt="gift image" style={{ width: 44 }} />
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
