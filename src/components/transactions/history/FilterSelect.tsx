import React from 'react';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';
import { Select, SelectOption } from '@app/components/elements/inputs/Select.tsx';
import { flip, offset } from '@floating-ui/react';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FilterWrapper } from './List.styles.ts';

export type TxHistoryFilter = 'all-activity' | 'rewards' | 'transactions';

const FILTER_TYPES: TxHistoryFilter[] = ['all-activity', 'rewards', 'transactions'] as const;

const renderCustomIcon = (isOpen: boolean) =>
    isOpen ? (
        <IoIosArrowUp size={11} style={{ marginLeft: 2 }} />
    ) : (
        <IoIosArrowDown size={11} style={{ marginLeft: 2 }} />
    );

interface FilterSelectProps {
    filter: TxHistoryFilter;
    handleFilterChange: (newFilter: TxHistoryFilter) => void;
}

export const FilterSelect = React.memo(({ filter, handleFilterChange }: FilterSelectProps) => {
    const { t } = useTranslation('wallet', { useSuspense: false });
    const filterOptions = useCallback(
        (): SelectOption<TxHistoryFilter>[] =>
            FILTER_TYPES.map((type) => ({
                label: t(type),
                value: type,
            })),
        [t]
    )();

    return (
        <FilterWrapper>
            <Select
                options={filterOptions}
                selectedValue={filter}
                onChange={handleFilterChange as (value: string) => void}
                variant="minimal"
                customIcon={renderCustomIcon}
                forceHeight={250}
                floatingProps={{
                    middleware: [offset({ mainAxis: 6 }), flip()],
                }}
                triggerTypographyProps={{
                    style: {
                        color: 'inherit',
                        fontSize: 11,
                        fontStyle: 'normal',
                        fontWeight: 500,
                        lineHeight: 'normal',
                        letterSpacing: -0.33,
                        textTransform: 'capitalize',
                        transition: 'opacity 0.2s ease-in-out',
                        borderRadius: 10,
                    },
                }}
                optionItemTypographyProps={{
                    style: {
                        textTransform: 'capitalize',
                    },
                }}
            />
        </FilterWrapper>
    );
});

FilterSelect.displayName = 'FilterSelect';
