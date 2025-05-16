import { useExchangeStore } from '@app/store/useExchangeStore.ts';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import Hero from './components/Hero.tsx';
import Content from './components/Content.tsx';

import { Wrapper } from './styles.ts';

export default function EXModal() {
    const data = useExchangeStore((s) => s.content);
    const showModal = useExchangeStore((s) => s.showModal);

    if (!data) return null;
    return (
        <Dialog open={!!showModal} disableClose>
            <DialogContent $disableOverflow $borderRadius="40px">
                <Wrapper>
                    <Hero
                        heroImgUrl={data.hero_img_url}
                        primaryCol={data.primary_colour}
                        secondaryCol={data.secondary_colour}
                    />
                    <Content data={data} />
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
}
