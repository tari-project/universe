import { useExchangeStore } from '@app/store/useExchangeStore.ts';
import { XCOption } from '@app/components/exchanges/universal/option/XCOption.tsx';
import { ListWrapper } from '@app/components/exchanges/universal/options/styles.ts';
import { Divider } from '@app/components/elements/Divider.tsx';

export const XCOptions = () => {
    const exchangeMiners = useExchangeStore((s) => s.exchangeMiners);
    const currentExchangeMiner = useExchangeStore((s) => s.currentExchangeMiner);
    const listItems = exchangeMiners
        ?.filter((em) => em.id !== currentExchangeMiner.id)
        ?.map((item) => {
            return <XCOption key={item.id} content={item} />;
        });

    return (
        <ListWrapper>
            <XCOption isCurrent content={currentExchangeMiner} />
            {exchangeMiners?.length ? <Divider /> : null}
            {listItems}
        </ListWrapper>
    );
};
