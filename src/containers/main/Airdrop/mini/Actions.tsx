import { ActionImgWrapper, ActionText, ActionWrapper, GemImg, Wrapper } from './Actions.style.ts';

import gem from '@app/assets/images/gem.png';
import gift from '@app/assets/images/gift.png';
import { useTranslation } from 'react-i18next';
import { useAirdropStore } from '@app/store';
import { formatNumber, FormatPreset } from '@app/utils';

export function Actions() {
    const { t } = useTranslation('airdrop');
    const gemCount = useAirdropStore((s) => s.userPoints?.base?.gems || 0);
    const formattedCount = formatNumber(gemCount, FormatPreset.COMPACT);
    return (
        <Wrapper>
            <ActionWrapper>
                <ActionImgWrapper>
                    <img src={gift} alt="gift image" style={{ width: 44 }} />
                </ActionImgWrapper>
                <ActionText>{t('invite')}</ActionText>
            </ActionWrapper>
            <ActionWrapper>
                <ActionImgWrapper>
                    <GemImg src={gem} alt="gem image" />
                </ActionImgWrapper>
                <ActionText>{formattedCount}</ActionText>
            </ActionWrapper>

            <ActionWrapper>
                <ActionImgWrapper>
                    <GemImg src={gem} alt="gem image" />
                </ActionImgWrapper>
                <ActionText>BLA</ActionText>
            </ActionWrapper>
        </Wrapper>
    );
}
