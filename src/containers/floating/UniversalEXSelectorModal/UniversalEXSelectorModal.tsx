import { useExchangeStore } from '@app/store/useExchangeStore.ts';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { Button } from '@app/components/AdminUI/styles';
import { invoke } from '@tauri-apps/api/core';
import { ExchangeMiner } from '@app/types/exchange';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function UniversalExchangeSelectorModal() {
    const data = useExchangeStore((s) => s.content);
    const { t } = useTranslation('common', { useSuspense: false });
    const showModal = useExchangeStore((s) => s.showUniversalModal);
    const exchangeMiners = useExchangeStore((s) => s.exchangeMiners);
    const [selectedExchangeMiner, setSelectedExchangeMiner] = useState<ExchangeMiner | undefined>(undefined);

    const confirmExchangeMiner = async () => {
        if (!selectedExchangeMiner) return;
        console.info('selected exchange: ', selectedExchangeMiner);
        await invoke('user_selected_exchange', { exchangeMiner: selectedExchangeMiner });
    };

    if (!data) return null;
    return (
        <Dialog open={!!showModal} disableClose>
            <DialogContent $disableOverflow $borderRadius="40px">
                {exchangeMiners?.map((miner) => (
                    <div key={miner.id} onClick={() => setSelectedExchangeMiner(miner)}>
                        {miner.name}
                    </div>
                ))}
                <Button onClick={confirmExchangeMiner}>{t('select')}</Button>
            </DialogContent>
        </Dialog>
    );
}
