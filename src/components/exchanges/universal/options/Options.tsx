import { universalExchangeMinerOption } from '@app/store/useExchangeStore.ts';
import { XCOption } from '@app/components/exchanges/universal/option/XCOption.tsx';
import { ListWrapper, ScrollWrapper } from '@app/components/exchanges/universal/options/styles.ts';
import { Divider } from '@app/components/elements/Divider.tsx';
import { useFetchExchangeBranding } from '@app/hooks/exchanges/fetchExchangeContent.ts';
import { useFetchExchangeList } from '@app/hooks/exchanges/fetchExchanges.ts';

export const XCOptions = () => {
    const { data: exchangeMiners } = useFetchExchangeList();
    const { data: currentExchangeMiner } = useFetchExchangeBranding();

    const listItems = exchangeMiners
        ?.filter((em) => em.id !== currentExchangeMiner?.id)
        ?.map((item) => {
            return <XCOption key={item.id} content={item} />;
        });

    return (
        <ListWrapper>
            <XCOption isCurrent content={currentExchangeMiner ?? universalExchangeMinerOption} />
            {exchangeMiners?.length ? <Divider /> : null}
            <ScrollWrapper>{listItems}</ScrollWrapper>
        </ListWrapper>
    );
};
