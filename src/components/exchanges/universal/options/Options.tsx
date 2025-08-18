import { XCOption } from '@app/components/exchanges/universal/option/XCOption.tsx';
import { ListWrapper, ScrollWrapper } from '@app/components/exchanges/universal/options/styles.ts';
import { Divider } from '@app/components/elements/Divider.tsx';
import { useFetchExchangeBranding } from '@app/hooks/exchanges/fetchExchangeContent.ts';
import { useFetchExchangeList } from '@app/hooks/exchanges/fetchExchanges.ts';
import { useState, useRef, useEffect } from 'react';
import { InternalWalletOption } from '../option/InternalWalletOption';

export const XCOptions = () => {
    const { data: exchangeMiners } = useFetchExchangeList();
    const { data: currentExchangeMiner } = useFetchExchangeBranding();
    const [activeId, setActiveId] = useState('');

    const optionRefs = useRef<Record<string, HTMLDivElement | null>>({});

    useEffect(() => {
        if (activeId && optionRefs.current[activeId]) {
            optionRefs.current[activeId]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [activeId]);

    function handleClick(id: string) {
        setActiveId(id);
    }

    const listItems = exchangeMiners
        ?.filter((em) => em.id !== currentExchangeMiner?.id)
        ?.map((item) => {
            const ref = (el: HTMLDivElement | null) => {
                optionRefs.current[item.id] = el;
            };
            if (item.id === 'universal' || item.slug === 'universal') {
                return (
                    <InternalWalletOption
                        key={item.id}
                        ref={ref}
                        isActive={activeId === item?.id}
                        onActiveClick={handleClick}
                    />
                );
            }
            return (
                <XCOption
                    key={item.id}
                    ref={ref}
                    content={item}
                    isActive={activeId === item.id}
                    onActiveClick={handleClick}
                />
            );
        });

    const isTari = currentExchangeMiner?.slug === 'universal' && currentExchangeMiner?.id === 'universal';

    // ref for current option
    const currentRef = (el: HTMLDivElement | null) => {
        if (currentExchangeMiner?.id) optionRefs.current[currentExchangeMiner.id] = el;
    };

    return (
        <ListWrapper>
            {currentExchangeMiner && !isTari && (
                <XCOption
                    ref={currentRef}
                    isCurrent
                    content={currentExchangeMiner}
                    isActive={activeId === currentExchangeMiner?.id}
                    onActiveClick={handleClick}
                />
            )}
            {currentExchangeMiner && isTari && (
                <InternalWalletOption
                    ref={currentRef}
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
