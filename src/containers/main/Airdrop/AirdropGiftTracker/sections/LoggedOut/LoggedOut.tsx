import { GIFT_GEMS, useAirdropStore } from '@app/store/useAirdropStore';
import { ClaimButton, GemPill, Image, Title, Wrapper } from './styles';
import { useTranslation } from 'react-i18next';
import gemImage from '../../images/gem.png';
import { useAirdropAuth } from '../../hooks/useAirdropAuth';

export default function LoggedOut() {
    const { t } = useTranslation(['airdrop'], { useSuspense: false });
    const { referralQuestPoints } = useAirdropStore();

    const { handleAuth } = useAirdropAuth();

    const handleClick = () => {
        handleAuth();
    };

    const gemsValue = (referralQuestPoints?.pointsForClaimingReferral || GIFT_GEMS).toLocaleString();

    return (
        <Wrapper>
            <ClaimButton onClick={handleClick}>
                <Title>{t('joinAirdrop')}</Title>

                <GemPill>
                    {gemsValue}
                    <Image src={gemImage} alt="" />
                </GemPill>
            </ClaimButton>
        </Wrapper>
    );
}
