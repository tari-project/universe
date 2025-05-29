import { setShowExchangeModal, useExchangeStore } from '@app/store/useExchangeStore.ts';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import Hero from './components/Hero.tsx';
import Content from './components/Content.tsx';

import { BackWrapper, Wrapper } from './styles.ts';
import { useConfigBEInMemoryStore } from '@app/store';
import { IconButton } from '@app/components/elements/buttons/IconButton.tsx';
import { IoArrowBack } from 'react-icons/io5';
import LoadingDots from '@app/components/elements/loaders/LoadingDots.tsx';

export default function EXModal() {
    const data = useExchangeStore((s) => s.content);
    const showModal = useExchangeStore((s) => s.showExchangeAddressModal);
    const isUniversal = useConfigBEInMemoryStore((s) => s.isUniversalMiner);

    return (
        <Dialog open={!!showModal} disableClose onOpenChange={setShowExchangeModal}>
            <DialogContent $disableOverflow $borderRadius="40px">
                {data ? (
                    <Wrapper>
                        {isUniversal && (
                            <BackWrapper>
                                <IconButton onClick={() => setShowExchangeModal(false)}>
                                    <IoArrowBack size={18} />
                                </IconButton>
                            </BackWrapper>
                        )}
                        <Hero
                            heroImgUrl={data.hero_img_url}
                            primaryCol={data.primary_colour}
                            secondaryCol={data.secondary_colour}
                        />
                        <Content data={data} />
                    </Wrapper>
                ) : (
                    <LoadingDots />
                )}
            </DialogContent>
        </Dialog>
    );
}
