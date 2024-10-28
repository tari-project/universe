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
    Copied,
    GemPill,
    GemImage,
} from './styles';
import genericHeroImage from './images/generic-image.png';
import gemImage from '../Airdrop/AirdropGiftTracker/images/gem.png';

import { useEffect, useState } from 'react';

export type PaperWalletModalSectionType = 'Connect' | 'QRCode';

export default function ShareRewardModal() {
    const showModal = useShareRewardStore((s) => s.showModal);
    const setShowModal = useShareRewardStore((s) => s.setShowModal);
    const block = useShareRewardStore((s) => s.block);
    const contributed = useShareRewardStore((s) => s.contributed);
    const reward = useShareRewardStore((s) => s.reward);

    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (copied) {
            setTimeout(() => {
                setCopied(false);
            }, 2000);
        }
    }, [copied]);

    const handleClose = () => {
        setShowModal(false);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText('https://tari.com');
        setCopied(true);
    };

    return (
        <AnimatePresence>
            {showModal && (
                <GreenModal onClose={handleClose} boxWidth={600} padding={30}>
                    <HeroImage src={genericHeroImage} alt="" />

                    <ContentWrapper>
                        <Title>I just mined tari</Title>
                        <WinnerPill>Winner of block #{block.toLocaleString()}</WinnerPill>

                        <BlackButton onClick={handleCopy}>
                            <AnimatePresence>
                                {copied && (
                                    <Copied initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                        Copied!
                                    </Copied>
                                )}
                            </AnimatePresence>
                            <GemPill>
                                5,000 <GemImage src={gemImage} alt="" />
                            </GemPill>
                            FLEX & INVITE
                        </BlackButton>

                        <Text>
                            I contributed <strong>{contributed.toLocaleString()} H/s</strong> to this block.
                        </Text>

                        <RewardWrapper>
                            <Label>my reward</Label>
                            <Value>
                                <Number>{reward}</Number>
                                XTM
                            </Value>
                        </RewardWrapper>
                    </ContentWrapper>
                </GreenModal>
            )}
        </AnimatePresence>
    );
}
