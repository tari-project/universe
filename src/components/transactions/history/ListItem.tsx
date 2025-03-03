import { TransactionInfo } from '@app/types/app-status.ts';
import { ContentWrapper, ItemWrapper, ValueWrapper } from './ListItem.styles.ts';
import { useRef } from 'react';
import { useInView } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Typography } from '@app/components/elements/Typography.tsx';
import { useAppConfigStore } from '@app/store/useAppConfigStore.ts';
import { formatNumber, FormatPreset } from '@app/utils';

interface HistoryListItemProps {
    item: TransactionInfo;
    showReplay?: boolean;
    index: number;
}

interface BaseItemProps {
    title: string;
    time: string;
    value: string;
    chip?: string;
}

function BaseItem({ title, time, value, chip }: BaseItemProps) {
    return (
        <ContentWrapper>
            <Typography style={{ gridArea: 'title' }}>{title}</Typography>
            <Typography variant="p" style={{ gridArea: 'time' }}>
                {time}
            </Typography>
            <ValueWrapper>{value}</ValueWrapper>
        </ContentWrapper>
    );
}
export function ListItem({ item, index, showReplay = false }: HistoryListItemProps) {
    const appLanguage = useAppConfigStore((s) => s.application_language);
    const systemLang = useAppConfigStore((s) => s.should_always_use_system_language);
    const { t } = useTranslation('sidebar', { useSuspense: false });
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { amount: 0.5, once: false });
    const itemTitle = `${t('block')} #${item.mined_in_block_height}`;
    const earningsFormatted = formatNumber(item.amount, FormatPreset.TXTM_COMPACT).toLowerCase();

    const itemTime = new Date(item.timestamp * 1000)?.toLocaleString(systemLang ? undefined : appLanguage, {
        month: 'short',
        day: '2-digit',
        hourCycle: 'h23',
        hour: 'numeric',
        minute: 'numeric',
    });
    const baseItem = <BaseItem title={itemTitle} time={itemTime} value={earningsFormatted} />;

    return (
        <ItemWrapper
            ref={ref}
            data-index={index}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={inView ? { scale: 1, opacity: 1 } : { scale: 0.7, opacity: 0 }}
            transition={{ duration: 0.2 }}
        >
            {baseItem}
        </ItemWrapper>
    );
}
