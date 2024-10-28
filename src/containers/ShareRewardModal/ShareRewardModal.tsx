import GreenModal from '@app/components/GreenModal/GreenModal';
import { AnimatePresence } from 'framer-motion';
import { useShareRewardStore } from '@app/store/useShareRewardStore';
import {
    BlackButton,
    ContentWrapper,
    HeroImage,
    Label,
    RewardWrapper,
    Text,
    Title,
    Value,
    WinnerPill,
    Number,
} from './styles';
import genericHeroImage from './images/generic-image.png';

export type PaperWalletModalSectionType = 'Connect' | 'QRCode';

export default function ShareRewardModal() {
    const showModal = useShareRewardStore((s) => s.showModal);
    const setShowModal = useShareRewardStore((s) => s.setShowModal);

    const handleClose = () => {
        setShowModal(false);
    };

    return (
        <AnimatePresence>
            {showModal && (
                <GreenModal onClose={handleClose} boxWidth={560} padding={20}>
                    <HeroImage src={genericHeroImage} alt="" />

                    <ContentWrapper>
                        <Title>I just mined tari</Title>
                        <WinnerPill>Winner of block #24,475</WinnerPill>

                        <BlackButton>
                            <span>FLEX & INVITE</span>
                        </BlackButton>

                        <Text>
                            I contributed <strong>14,475 H/s</strong> to this block.
                        </Text>

                        <RewardWrapper>
                            <Label>my reward</Label>
                            <Value>
                                <Number>2.15</Number>
                                XTM
                            </Value>
                        </RewardWrapper>
                    </ContentWrapper>
                </GreenModal>
            )}
        </AnimatePresence>
    );
}
