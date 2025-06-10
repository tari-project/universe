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
    MainLogoImage,
    MainLogoOverlay,
    MainLogoBottomRow,
} from './styles';
import { XCOptions } from '@app/components/exchanges/universal/options/Options.tsx';
import { Countdown, CountdownText } from '@app/components/exchanges/universal/option/styles';
import { formatCountdown } from '@app/utils';
import { Typography } from '@app/components/elements/Typography';

export default function UniversalEXSelectorModal() {
    const { t } = useTranslation(['exchange', 'common'], { useSuspense: false });
    const showModal = useExchangeStore((s) => s.showUniversalModal);
    const currentExchangeMiner = useExchangeStore((s) => s.currentExchangeMiner);
    const isUniversalExchange = currentExchangeMiner.id === 'universal';

    return (
        <Dialog open={!!showModal} onOpenChange={setShowUniversalModal}>
            <DialogContent $disableOverflow $borderRadius="40px">
                <Wrapper>
                    <HeaderSection>
                        <Heading>{t('select.modal-title')}</Heading>
                        {!isUniversalExchange && (
                            <MainLogoContainer>
                                <MainLogoImage
                                    src="/assets/img/exchange_miner_header_logo.png"
                                    alt="Exchange Miner Header Logo"
                                    style={{ width: '100%' }}
                                />
                                <MainLogoOverlay
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        color: 'white',
                                        padding: '20px',
                                        gap: '10px',
                                    }}
                                >
                                    <MainLogoTitle>{t('main-logo-title', { ns: 'exchange' })}</MainLogoTitle>
                                    <MainLogoDescription>
                                        {currentExchangeMiner.campaign_description}
                                    </MainLogoDescription>
                                    {currentExchangeMiner.reward_expiry_date && (
                                        <MainLogoBottomRow
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'row',
                                                gap: '20px',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <Countdown style={{ backgroundColor: 'white' }}>
                                                <CountdownText>
                                                    {formatCountdown(currentExchangeMiner.reward_expiry_date)}
                                                </CountdownText>
                                            </Countdown>
                                            <Typography variant="p" style={{ fontWeight: 500 }}>
                                                {t('time-left', { ns: 'exchange' })}
                                            </Typography>
                                        </MainLogoBottomRow>
                                    )}
                                </MainLogoOverlay>
                            </MainLogoContainer>
                        )}
                    </HeaderSection>
                    <XCOptions />
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
}
