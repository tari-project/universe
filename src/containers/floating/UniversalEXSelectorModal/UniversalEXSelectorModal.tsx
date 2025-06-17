import { setShowUniversalModal, useExchangeStore } from '@app/store/useExchangeStore.ts';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { useTranslation } from 'react-i18next';
import { HeaderSection, Heading, Wrapper, RewardBanner, BannerHeading, BannerSubheading } from './styles';
import { XCOptions } from '@app/components/exchanges/universal/options/Options.tsx';
import { CloseButton, CloseWrapper } from '@app/components/exchanges/commonStyles.ts';
import { IoClose } from 'react-icons/io5';
import GradientText from '@app/components/elements/gradientText/GradientText.tsx';

export default function UniversalEXSelectorModal() {
    const showModal = useExchangeStore((s) => s.showUniversalModal);
    const rewardAmt = useExchangeStore((s) => s.reward_earn_cap_percentage);
    const rewardEndDate = useExchangeStore((s) => s.reward_end_date);
    const { t } = useTranslation(['exchange', 'common'], { useSuspense: false });

    function handleClose() {
        setShowUniversalModal(false);
    }

    const rewardImgSrc = `/assets/img/exchange_miner_header.png`;

    return (
        <Dialog open={!!showModal} onOpenChange={handleClose}>
            <DialogContent $borderRadius="40px" $transparentBg $unPadded>
                <Wrapper>
                    <CloseWrapper>
                        <CloseButton onClick={handleClose}>
                            <IoClose />
                        </CloseButton>
                    </CloseWrapper>
                    <HeaderSection>
                        <Heading>{t('select.modal-title')}</Heading>
                    </HeaderSection>

                    <RewardBanner>
                        <BannerHeading>
                            <GradientText colors={['#FFE37C', '#FFD231', '#FFE37C']}>
                                {t('main-logo-title')}
                            </GradientText>
                        </BannerHeading>
                        <BannerSubheading>{t('earn', { amount: rewardAmt })}</BannerSubheading>
                    </RewardBanner>
                    <XCOptions />
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
}
