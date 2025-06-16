import { setShowUniversalModal, useExchangeStore } from '@app/store/useExchangeStore.ts';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { useTranslation } from 'react-i18next';
import { HeaderSection, Heading, Wrapper, MainLogoContainer, MainLogoImageWrapper } from './styles';
import { XCOptions } from '@app/components/exchanges/universal/options/Options.tsx';
import { CloseButton, CloseWrapper } from '@app/components/exchanges/commonStyles.ts';
import { IoClose } from 'react-icons/io5';
import { useFetchExchangeBranding } from '@app/hooks/exchanges/fetchExchangeContent.ts';

export default function UniversalEXSelectorModal() {
    const showModal = useExchangeStore((s) => s.showUniversalModal);
    const { t } = useTranslation(['exchange', 'common'], { useSuspense: false });
    const { data: currentExchangeMiner } = useFetchExchangeBranding();

    function handleClose() {
        setShowUniversalModal(false);
    }

    const rewardImgSrc = currentExchangeMiner?.reward_image;

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

                    {rewardImgSrc ? (
                        <MainLogoContainer>
                            <MainLogoImageWrapper>
                                <img src={rewardImgSrc} alt="Exchange Miner Header Logo" />
                            </MainLogoImageWrapper>
                        </MainLogoContainer>
                    ) : null}
                    <XCOptions />
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
}
