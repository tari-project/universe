import { GIFT_GEMS, useAirdropStore } from '@app/store/useAirdropStore';
import { ClaimButton, GemPill, Image, Title, Wrapper } from './styles';
import { useEffect, useState } from 'react';
import ClaimModal from '../../components/ClaimModal/ClaimModal';
import { useTranslation } from 'react-i18next';
import gemImage from '../../images/gem.png';
import { useAirdropAuth } from '../../hooks/useAirdropAuth';

export default function LoggedOut() {
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const { t } = useTranslation(['airdrop'], { useSuspense: false });
    const { referralQuestPoints } = useAirdropStore();

    const { handleAuth, checkAuth } = useAirdropAuth();

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const gemsValue = (referralQuestPoints?.pointsForClaimingReferral || GIFT_GEMS).toLocaleString();

    return (
        <>
            <Wrapper>
                <ClaimButton onClick={() => setModalIsOpen(true)}>
                    <Title>{t('claimGems')}</Title>

                    <GemPill>
                        {gemsValue}
                        <Image src={gemImage} alt="" />
                    </GemPill>
                </ClaimButton>
            </Wrapper>
            {modalIsOpen && <ClaimModal onSubmit={handleAuth} onClose={() => setModalIsOpen(false)} />}
        </>
    );
}
