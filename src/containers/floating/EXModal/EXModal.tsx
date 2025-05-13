import { IoClose } from 'react-icons/io5';
import { setShowExchangeModal, useExchangeStore } from '@app/store/useExchangeStore.ts';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import Hero from './components/Hero.tsx';
import Content from './components/Content.tsx';

import { CloseButton, Wrapper } from './styles.ts';

export default function EXModal() {
    const data = useExchangeStore((s) => s.content);
    const showModal = useExchangeStore((s) => s.showModal);

    return (
        <Dialog open={showModal} onOpenChange={setShowExchangeModal}>
            <DialogContent $disableOverflow $borderRadius="40px">
                <Wrapper>
                    <CloseButton onClick={() => setShowExchangeModal(false)}>
                        <IoClose />
                    </CloseButton>
                    <Hero
                        heroImgUrl={data.exchange_hero_img}
                        primaryCol={data.primary_col}
                        secondaryCol={data.secondary_col}
                    />
                    <Content data={data} />
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
}
