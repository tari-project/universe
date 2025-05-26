import { setShowExchangeModal, setShowUniversalModal, useExchangeStore } from '@app/store/useExchangeStore.ts';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';

import { invoke } from '@tauri-apps/api/core';
import { ExchangeMiner } from '@app/types/exchange';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchBackendInMemoryConfig } from '@app/store/actions/appConfigStoreActions';
import { SquaredButton } from '@app/components/elements/buttons/SquaredButton';
import { EXMiner, EXMinerList, HeaderSection, Heading, Wrapper } from './styles';

export default function UniversalEXSelectorModal() {
    const { t } = useTranslation(['exchange', 'common'], { useSuspense: false });
    const showModal = useExchangeStore((s) => s.showUniversalModal);
    const exchangeMiners = useExchangeStore((s) => s.exchangeMiners);
    const [selectedExchangeMiner, setSelectedExchangeMiner] = useState<ExchangeMiner | undefined>(undefined);

    const confirmExchangeMiner = async () => {
        if (!selectedExchangeMiner) return;
        setShowUniversalModal(false); // TODO make it last statement in this function after being done with testing
        await invoke('user_selected_exchange', { exchangeMiner: selectedExchangeMiner });
        await fetchBackendInMemoryConfig();
        console.info('[DEBUG UNIVERSAL EXCHANGE] Fetched backend in memory config');
        setShowExchangeModal(true);
    };

    return (
        <Dialog open={!!showModal} disableClose>
            <DialogContent $disableOverflow $borderRadius="40px" $transparentBg>
                <Wrapper>
                    <HeaderSection>
                        <Heading>{t('select.modal-title')}</Heading>
                    </HeaderSection>
                    <EXMinerList>
                        {exchangeMiners?.map((miner) => (
                            <EXMiner
                                selected={miner === selectedExchangeMiner}
                                onClick={() => setSelectedExchangeMiner(miner)}
                                key={miner.id}
                            >
                                {miner.name}
                            </EXMiner>
                        ))}
                    </EXMinerList>
                    <SquaredButton
                        color="brightGreen"
                        size="medium"
                        onClick={confirmExchangeMiner}
                        disabled={!selectedExchangeMiner}
                    >
                        {t('common:select')}
                    </SquaredButton>
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
}
