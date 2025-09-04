import { setShowUniversalModal, useExchangeStore } from '@app/store/useExchangeStore.ts';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { useTranslation } from 'react-i18next';
import {
    HeaderSection,
    Heading,
    Wrapper,
    RewardBanner,
    BannerHeading,
    BannerSubheading,
    CountdownWrapper,
    CountdownExplainerText,
} from './styles';
import { XCOptions } from '@app/components/exchanges/universal/options/Options.tsx';
import { CloseButton } from '@app/components/exchanges/commonStyles.ts';
import { IoClose } from 'react-icons/io5';
import GradientText from '@app/components/elements/gradientText/GradientText.tsx';
import { Countdown, CountdownText } from '@app/components/exchanges/universal/option/styles.ts';
import { formatCountdown } from '@app/utils';

export default function UniversalEXSelectorModal() {
    const showModal = useExchangeStore((s) => s.showUniversalModal);
    const rewardAmt = useExchangeStore((s) => s.reward_earn_cap_percentage);
    const rewardEndDate = useExchangeStore((s) => s.reward_end_date);
    const { t } = useTranslation(['exchange', 'common'], { useSuspense: false });

    function handleClose() {
        setShowUniversalModal(false);
    }

    const bannerMarkup = rewardAmt ? (
        <RewardBanner>
            <BannerHeading>
                <GradientText colors={['#FFE37C', '#FFD231', '#FFE37C']}>{t('main-logo-title')}</GradientText>
            </BannerHeading>
            <BannerSubheading>{t('earn', { amount: rewardAmt })}</BannerSubheading>
            {rewardEndDate ? (
                <CountdownWrapper>
                    <Countdown>
                        <CountdownText>{formatCountdown(rewardEndDate)}</CountdownText>
                    </Countdown>
                    <CountdownExplainerText>{t('time-left')}</CountdownExplainerText>
                </CountdownWrapper>
            ) : null}
        </RewardBanner>
    ) : null;

    return (
        <Dialog open={!!showModal} onOpenChange={handleClose}>
            <DialogContent variant="transparent" $unPadded>
                <Wrapper>
                    <CloseButton onClick={handleClose}>
                        <IoClose />
                    </CloseButton>

                    <HeaderSection>
                        <Heading>{t('select.modal-title')}</Heading>
                    </HeaderSection>
                    {bannerMarkup}
                    <XCOptions />
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
}
