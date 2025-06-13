import { XCOption } from '@app/components/exchanges/universal/option/XCOption.tsx';
import { ListWrapper, ScrollWrapper } from '@app/components/exchanges/universal/options/styles.ts';
import { Divider } from '@app/components/elements/Divider.tsx';
import { useFetchExchangeBranding } from '@app/hooks/exchanges/fetchExchangeContent.ts';
import { useFetchExchangeList } from '@app/hooks/exchanges/fetchExchanges.ts';
import { useState } from 'react';

export const XCOptions = () => {
    const { data: exchangeMiners } = useFetchExchangeList();
    const { data: currentExchangeMiner } = useFetchExchangeBranding();
    const [activeId, setActiveId] = useState('');

    function handleClick(id: string) {
        setActiveId(id);
    }

    const listItems = exchangeMiners
        ?.filter((em) => em.id !== currentExchangeMiner?.id)
        ?.map((item) => {
            return (
                <XCOption key={item.id} content={item} isActive={activeId === item.id} onActiveClick={handleClick} />
            );
        });

    return (
        <ListWrapper>
            {currentExchangeMiner && (
                <XCOption
                    isCurrent
                    content={currentExchangeMiner}
                    isActive={activeId === currentExchangeMiner?.id}
                    onActiveClick={handleClick}
                />
            )}
            {exchangeMiners?.length ? <Divider /> : null}
            <ScrollWrapper>{listItems}</ScrollWrapper>
        </ListWrapper>
    );
};
