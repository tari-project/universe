import { Button } from '@app/components/elements/buttons/Button';
import TariPurpleLogo from './icons/TariPurpleLogo';
import { Wrapper, WhiteBox, WhiteBoxLabel, WhiteBoxValue, Currency, Amount } from './styles';
import { useTranslation } from 'react-i18next';
import { formatNumber, FormatPreset, truncateMiddle } from '@app/utils';

import ProcessingIcon from './icons/ProcessingIcon';
import CompletedIcon from './icons/CompletedIcon';
import LoadingDots from './icons/LoadingDots';
import { useEffect } from 'react';
import { SendStatus } from '@app/components/transactions/send/SendModal.tsx';
import { useWalletStore } from '@app/store';
import { StatusHero } from '../../components/StatusHero/StatusHero';
import { StatusList, StatusListEntry } from '../../components/StatusList/StatusList';

interface Props {
    status: SendStatus;
    setStatus: (status: SendStatus) => void;
    amount?: number;
    address: string;
    message?: string;
    networkFee?: number;
    feePercentage?: number;
    handleClose: () => void;
}

export function SendReview({
    status,
    setStatus,
    amount,
    address,
    message,
    //networkFee,
    //feePercentage,
    handleClose,
}: Props) {
    const { t } = useTranslation('wallet');
    const latestPendingTx = useWalletStore((s) => s.pending_transactions?.[0]);
    const latestTx = useWalletStore((s) => s.transactions?.[0]);

    useEffect(() => {
        if (status !== 'processing' || !latestTx || !latestPendingTx) return;
        if (latestTx.timestamp === latestPendingTx?.timestamp) {
            setStatus('completed');
        }
    }, [status, setStatus, latestTx, latestPendingTx]);

    const formattedAmount = formatNumber((amount || 0) * 1_000_000, FormatPreset.XTM_LONG);
    const formattedAddress = truncateMiddle(address, 5);

    const reviewEntries: StatusListEntry[] = [
        {
            label: t('send.destination-address'),
            value: address,
        },
        {
            label: t('send.transaction-description'),
            value: message,
        },
        // {
        //     label: t('send.network-fee'),
        //     value: networkFee,
        //     valueRight: `${feePercentage}%`,
        // },
        // {
        //     label: t('send.estimated-completion-time'),
        //     value: '8 mins',
        // },
    ];

    const statusEntries: StatusListEntry[] = [
        {
            label: t('send.status'),
            value: status === 'processing' ? t('send.processing') : t('send.completed'),
            status,
        },
        // {
        //     label: t('send.total-fees'),
        //     value: `${feePercentage}%`,
        // },
        {
            label: t('send.destination-address'),
            value: address,
        },
        {
            label: t('send.transaction-description'),
            value: message,
        },
        {
            label: t('send.transaction-id'),
            value: status === 'processing' ? <LoadingDots /> : latestTx?.tx_id,
        },
        // {
        //     label: t('send.tari-txn'),
        //     value: status === 'processing' ? <LoadingDots /> : `0x12345..12789`,
        //     externalLink: status === 'processing' ? undefined : `#`,
        // },
    ];

    return (
        <Wrapper>
            {status === 'reviewing' ? (
                <>
                    <WhiteBox>
                        <WhiteBoxLabel>{t('send.review-label')}</WhiteBoxLabel>

                        <WhiteBoxValue>
                            <TariPurpleLogo />
                            <Amount>{formattedAmount}</Amount>
                            <Currency>{`XTM`}</Currency>
                        </WhiteBoxValue>
                    </WhiteBox>

                    <StatusList entries={reviewEntries} />

                    <Button type="submit" fluid size="xlarge" variant="green">
                        {t('send.cta-confirm')}
                    </Button>
                </>
            ) : (
                <>
                    {status === 'processing' && (
                        <StatusHero icon={<ProcessingIcon />} title={t('send.processing-title')}>
                            {t('send.processing-text')}
                        </StatusHero>
                    )}

                    {status === 'completed' && (
                        <StatusHero icon={<CompletedIcon />} title={t('send.completed-title')}>
                            <>
                                {t('send.completed-text')}
                                <br />
                                <strong>{`${formattedAmount} XTM`}</strong> {t('send.completed-amount-sent')}{' '}
                                <strong>{formattedAddress}</strong>
                                {`.`}
                            </>
                        </StatusHero>
                    )}

                    <StatusList entries={statusEntries} />

                    {status === 'processing' && (
                        <Button type="button" fluid size="xlarge" variant="purple" disabled={true}>
                            {t('send.processing-button')}
                        </Button>
                    )}

                    {status === 'completed' && (
                        <Button type="button" fluid size="xlarge" variant="purple" onClick={handleClose}>
                            {t('send.done-button')}
                        </Button>
                    )}
                </>
            )}
        </Wrapper>
    );
}
