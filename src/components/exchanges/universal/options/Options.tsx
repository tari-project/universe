import { useExchangeStore } from '@app/store/useExchangeStore.ts';
import { XCOption } from '@app/components/exchanges/universal/option/XCOption.tsx';
import { ListWrapper } from '@app/components/exchanges/universal/options/styles.ts';
import { Divider } from '@app/components/elements/Divider.tsx';

export const XCOptions = () => {
    const exchangeMiners = useExchangeStore((s) => s.exchangeMiners);

    const listItems = exchangeMiners?.map((item) => {
        return <XCOption key={item.id} title={item.name} />;
    });

    return (
        <ListWrapper>
            <XCOption title="Tari Universe" isCurrent />
            <Divider />
            {listItems}
        </ListWrapper>
    );
};
