import {
    ActionWrapper,
    BoxWrapper,
    ClaimButton,
    Cover,
    Gem1,
    Gem2,
    Gem3,
    GemsWrapper,
    GemTextImage,
    ShareWrapper,
    StyledInput,
    Text,
    TextButton,
    TextWrapper,
    Title,
    Wrapper,
} from './styles';
import gemImage from './images/gems.png';
import gemLargeImage from './images/gem-large.png';
import { useCallback, useState } from 'react';
import { GIFT_GEMS, useAirdropStore } from '@app/store/useAirdropStore';
import { Trans, useTranslation } from 'react-i18next';

interface ClaimModalProps {
    onSubmit: (code?: string) => void;
    onClose: () => void;
}

export default function ClaimModal({ onSubmit, onClose }: ClaimModalProps) {
    const referralQuestPoints = useAirdropStore((state) => state.referralQuestPoints);
    const { t } = useTranslation(['airdrop'], { useSuspense: false });

    const [claimCode, setClaimCode] = useState('');

    const handleSubmit = useCallback(async () => {
        return onSubmit(claimCode);
    }, [claimCode, onSubmit]);

    return (
        <Wrapper>
            <BoxWrapper initial={{ opacity: 0, y: '100px' }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <GemsWrapper>
                    <Gem1 src={gemLargeImage} alt="" />
                    <Gem2 src={gemLargeImage} alt="" />
                    <Gem3 src={gemLargeImage} alt="" />
                </GemsWrapper>

                <TextWrapper>
                    <Title>
                        <Trans
                            ns="airdrop"
                            i18nKey="claimReferralCode"
                            components={{ span: <span />, image: <GemTextImage src={gemImage} alt="" /> }}
                            values={{ gems: referralQuestPoints?.pointsForClaimingReferral || GIFT_GEMS }}
                        />
                    </Title>
                    <Text>
                        {t('claimReferralGifts', { gems: referralQuestPoints?.pointsForClaimingReferral || GIFT_GEMS })}
                    </Text>
                </TextWrapper>
                <ActionWrapper>
                    <ShareWrapper $isClaim>
                        <StyledInput
                            type="text"
                            placeholder="Enter referral code"
                            onChange={(e) => setClaimCode(e.target.value)}
                            value={claimCode}
                        />
                        {
                            // <Button color="primary" onClick={handleReferral}>
                            //     Claim
                            // </Button>
                        }
                    </ShareWrapper>
                    <ClaimButton onClick={handleSubmit}> {t('claimGems')} </ClaimButton>
                </ActionWrapper>
                <ActionWrapper>
                    <TextButton onClick={onClose}>{t('doLater')}</TextButton>
                </ActionWrapper>
            </BoxWrapper>

            <Cover onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
        </Wrapper>
    );
}
