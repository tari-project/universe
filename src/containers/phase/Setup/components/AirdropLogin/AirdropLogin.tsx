import { ClaimButton, GemImage, GemsWrapper, GiftImage, Text, TextWrapper, Title, Wrapper } from './styles';
import gemLargeImage from '../../../../main/Airdrop/AirdropGiftTracker/images/gem.png';
import { useTranslation, Trans } from 'react-i18next';
import { useCallback } from 'react';
import { useAppConfigStore } from '@app/store/useAppConfigStore';
import { useAirdropAuth } from '@app/containers/main/Airdrop/AirdropGiftTracker/hooks/useAirdropAuth';
import { REFERRAL_GEMS, useAirdropStore } from '@app/store/useAirdropStore';
import giftImage from './images/gift.png';

export default function AirdropLogin() {
    const { t } = useTranslation(['airdrop'], { useSuspense: false });
    const setAllowTelemetry = useAppConfigStore((s) => s.setAllowTelemetry);
    const { handleAuth } = useAirdropAuth();
    const { referralQuestPoints } = useAirdropStore();

    const gems = (referralQuestPoints?.pointsForClaimingReferral || REFERRAL_GEMS).toLocaleString();

    const handleSubmit = useCallback(
        async (e: React.MouseEvent<HTMLButtonElement>) => {
            e.preventDefault();
            e.stopPropagation();
            await setAllowTelemetry(true);
            return handleAuth();
        },
        [handleAuth, setAllowTelemetry]
    );

    return (
        <Wrapper initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
            <GemsWrapper>
                <GiftImage src={giftImage} alt="" />
                <GemImage
                    src={gemLargeImage}
                    alt=""
                    style={{
                        top: '40px',
                        left: '42px',
                        width: '38px',
                        rotate: '-50deg',
                    }}
                />
                <GemImage
                    src={gemLargeImage}
                    alt=""
                    style={{
                        top: '75px',
                        left: '22px',
                        width: '26px',
                        rotate: '0deg',
                        opacity: '0.7',
                    }}
                />
                <GemImage
                    src={gemLargeImage}
                    alt=""
                    style={{
                        top: '88px',
                        left: '46px',
                        width: '48px',
                        rotate: '10deg',
                        opacity: '0.7',
                    }}
                />

                <GemImage
                    src={gemLargeImage}
                    alt=""
                    style={{
                        top: '38px',
                        right: '66px',
                        width: '26px',
                        rotate: '-40deg',
                    }}
                />
                <GemImage
                    src={gemLargeImage}
                    alt=""
                    style={{
                        top: '60px',
                        right: '28px',
                        width: '48px',
                        rotate: '32deg',
                        opacity: '0.7',
                    }}
                />
                <GemImage
                    src={gemLargeImage}
                    alt=""
                    style={{
                        top: '100px',
                        right: '49px',
                        width: '38px',
                        rotate: '-50deg',
                        opacity: '0.7',
                    }}
                />
            </GemsWrapper>

            <TextWrapper>
                <Title>
                    <Trans i18nKey="setupLoginTitle" ns="airdrop" values={{ gems }} components={{ span: <span /> }} />
                </Title>
                <Text>{t('setupLoginText')}</Text>
            </TextWrapper>

            <ClaimButton onClick={handleSubmit}>
                <span>{t('claimGems')}</span>
            </ClaimButton>
        </Wrapper>
    );
}
