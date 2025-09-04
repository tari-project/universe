import { Button } from '@app/components/elements/buttons/Button';
import TariPurpleLogo from './icons/TariPurpleLogo';
import { Wrapper, WhiteBox, WhiteBoxLabel, WhiteBoxValue, Currency, Amount } from './styles';
import { useTranslation } from 'react-i18next';
import { formatNumber, FormatPreset, truncateMiddle } from '@app/utils';

import ProcessingIcon from './icons/ProcessingIcon';
import CompletedIcon from './icons/CompletedIcon';

import { SendStatus } from '@app/components/transactions/send/SendModal.tsx';
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
    // setStatus,
    amount,
    address,
    message,
    //networkFee,
    //feePercentage,
    handleClose,
}: Props) {
    const { t } = useTranslation('wallet');

    const formattedAmount = formatNumber((amount || 0) * 1_000_000, FormatPreset.XTM_COMPACT);
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
    ];

    const statusEntries: StatusListEntry[] = [
        {
            label: t('send.status'),
            value: status === 'processing' ? t('send.processing') : t('send.broadcast'),
            status,
        },
        {
            label: t('send.destination-address'),
            value: address,
        },
        {
            label: t('send.transaction-description'),
            value: message,
        },
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
