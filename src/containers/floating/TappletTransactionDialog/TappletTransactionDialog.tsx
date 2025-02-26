import { useTranslation } from 'react-i18next';

import { useUIStore } from '@app/store/useUIStore';

import { DialogContent, Dialog } from '@app/components/elements/dialog/Dialog';
import { SquaredButton } from '@app/components/elements/buttons/SquaredButton';
import { Typography } from '@app/components/elements/Typography';
import { memo, useCallback, useState } from 'react';
import { ButtonsWrapper } from './TappletTransactionDialog.styles';
import { useTappletProviderStore } from '@app/store/useTappletProviderStore';

const TappletTransactionDialog = memo(function AutoUpdateDialog() {
    const { t } = useTranslation('setup-view', { useSuspense: false }); //TODO add transaltion
    const open = useUIStore((s) => s.dialogToShow === 'txSimulation');
    const setDialogToShow = useUIStore((s) => s.setDialogToShow);
    const [maxFee, setMaxFee] = useState(0);
    const getPendingTransaction = useTappletProviderStore((s) => s.getPendingTransaction);
    const tx = getPendingTransaction();

    const handleClose = useCallback(() => {
        console.info('Tx cancelled');
        console.warn('Cancel TX', tx);
        setMaxFee(0);
        setDialogToShow(null);
        if (!tx) return;
        tx.cancel();
    }, [setDialogToShow, tx]);

    const handleSubmit = useCallback(async () => {
        const isDryRun = maxFee == 0;
        console.warn('SUBMIT run TX', tx);
        if (!tx) return;
        if (isDryRun) {
            const { balanceUpdates, txSimulation, estimatedFee } = await tx.runSimulation();
            console.warn('SIIIIMULATION RES TX', txSimulation);
            if (estimatedFee) setMaxFee(estimatedFee);
            console.warn('SIIIIMULATION RES BALANCES', balanceUpdates);
            console.warn('SIIIIMULATION RES FEE', estimatedFee);
            return;
        } else {
            const result = await tx.submit();
            console.warn('TX submit result', result);
            setMaxFee(0);
            setDialogToShow(null);
        }
    }, [maxFee, setDialogToShow, tx]);

    return (
        <Dialog open={open} onOpenChange={handleClose} disableClose>
            <DialogContent>
                <Typography variant="h3">{'Transaction'}</Typography>
                <Typography variant="p">{`Id ${tx?.id} fee: ${maxFee}`}</Typography>
                <Typography variant="p">{`Status ${tx?.status}`}</Typography>
                <ButtonsWrapper>
                    <>
                        <SquaredButton onClick={handleClose} color="warning">
                            {'Cancel'}
                        </SquaredButton>
                        <SquaredButton onClick={handleSubmit} color="green">
                            {maxFee ? 'Submit' : 'Estimate fee'}
                        </SquaredButton>
                    </>
                </ButtonsWrapper>
            </DialogContent>
        </Dialog>
    );
});

export default TappletTransactionDialog;
