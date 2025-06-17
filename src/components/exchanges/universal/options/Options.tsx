import { XCOption } from '@app/components/exchanges/universal/option/XCOption.tsx';
import { ListWrapper, ScrollWrapper } from '@app/components/exchanges/universal/options/styles.ts';
import { Divider } from '@app/components/elements/Divider.tsx';
import { useFetchExchangeBranding } from '@app/hooks/exchanges/fetchExchangeContent.ts';
import { useFetchExchangeList } from '@app/hooks/exchanges/fetchExchanges.ts';
import { useState } from 'react';
import { InternalWalletOption } from '../option/InternalWalletOption';

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
            if (item.id === 'universal' || item.slug === 'universal') {
                return (
                    <InternalWalletOption key={item.id} isActive={activeId === item?.id} onActiveClick={handleClick} />
                );
            }

            return (
                <XCOption key={item.id} content={item} isActive={activeId === item.id} onActiveClick={handleClick} />
            );
        });

    const isTari = currentExchangeMiner?.slug === 'universal' && currentExchangeMiner?.id === 'universal';

    return (
        <ListWrapper>
            {currentExchangeMiner && !isTari && (
                <XCOption
                    isCurrent
                    content={currentExchangeMiner}
                    isActive={activeId === currentExchangeMiner?.id}
                    onActiveClick={handleClick}
                />
            )}
            {currentExchangeMiner && isTari && (
                <InternalWalletOption
                    isCurrent
                    isActive={activeId === currentExchangeMiner?.id}
                    onActiveClick={handleClick}
                />
            )}
            {exchangeMiners?.length ? <Divider /> : null}
            <ScrollWrapper>{listItems}</ScrollWrapper>
        </ListWrapper>
    );
};
