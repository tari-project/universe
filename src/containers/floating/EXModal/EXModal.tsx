import { setShowExchangeModal, useExchangeStore } from '@app/store/useExchangeStore.ts';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import Hero from './components/Hero.tsx';
import Content from './components/Content.tsx';

import { Wrapper } from './styles.ts';
import LoadingDots from '@app/components/elements/loaders/LoadingDots.tsx';
import { useFetchExchangeBranding } from '@app/hooks/exchanges/fetchExchangeContent.ts';

export default function EXModal() {
    const { data } = useFetchExchangeBranding();
    const showModal = useExchangeStore((s) => s.showExchangeAddressModal);

    return (
        <Dialog open={!!showModal} disableClose onOpenChange={setShowExchangeModal}>
            <DialogContent $disableOverflow $borderRadius="40px">
                {data ? (
                    <Wrapper>
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
