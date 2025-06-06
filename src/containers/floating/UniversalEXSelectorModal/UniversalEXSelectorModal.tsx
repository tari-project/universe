import { setShowUniversalModal, useExchangeStore } from '@app/store/useExchangeStore.ts';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { useTranslation } from 'react-i18next';
import { HeaderSection, Heading, Wrapper } from './styles';
import { XCOptions } from '@app/components/exchanges/universal/options/Options.tsx';

export default function UniversalEXSelectorModal() {
    const { t } = useTranslation(['exchange', 'common'], { useSuspense: false });
    const showModal = useExchangeStore((s) => s.showUniversalModal);

    return (
        <Dialog open={!!showModal} onOpenChange={setShowUniversalModal}>
            <DialogContent $disableOverflow $borderRadius="40px">
                <Wrapper>
                    <HeaderSection>
                        <Heading>{t('select.modal-title')}</Heading>
                    </HeaderSection>
                    <XCOptions />
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
}
