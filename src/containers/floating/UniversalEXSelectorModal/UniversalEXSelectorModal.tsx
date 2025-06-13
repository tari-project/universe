import { setShowUniversalModal, useExchangeStore } from '@app/store/useExchangeStore.ts';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { useTranslation } from 'react-i18next';
import {
    HeaderSection,
    Heading,
    MainLogoTitle,
    Wrapper,
    MainLogoDescription,
    MainLogoContainer,
    MainLogoBottomRow,
    MainLogoImageWrapper,
} from './styles';
import { XCOptions } from '@app/components/exchanges/universal/options/Options.tsx';
import { Countdown, CountdownText } from '@app/components/exchanges/universal/option/styles';
import { formatCountdown } from '@app/utils';
import { Typography } from '@app/components/elements/Typography';
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

                    <MainLogoContainer>
                        <MainLogoImageWrapper>
                            <img src="/assets/img/exchange_miner_header.png" alt="Exchange Miner Header Logo" />
                        </MainLogoImageWrapper>
                        <MainLogoTitle>{t('main-logo-title', { ns: 'exchange' })}</MainLogoTitle>
                        <MainLogoDescription>{currentExchangeMiner?.campaign_description}</MainLogoDescription>
                        {currentExchangeMiner?.reward_expiry_date && (
                            <MainLogoBottomRow>
                                <Countdown>
                                    <CountdownText>
                                        {formatCountdown(currentExchangeMiner.reward_expiry_date)}
                                    </CountdownText>
                                </Countdown>
                                <Typography variant="p" style={{ fontWeight: 500 }}>
                                    {t('time-left', { ns: 'exchange' })}
                                </Typography>
                            </MainLogoBottomRow>
                        )}
                    </MainLogoContainer>
                    <XCOptions />
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
}
