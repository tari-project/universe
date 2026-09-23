import { useTranslation } from 'react-i18next';
import { Typography } from '@app/components/elements/Typography';
import { formatNumber, FormatPreset } from '@app/utils';
import { StatusList, StatusListEntry } from '../components/StatusList/StatusList';
import TariPurpleLogo from './SendReview/icons/TariPurpleLogo';
import { Amount, Currency, WhiteBox, WhiteBoxLabel, WhiteBoxValue, Wrapper } from './SendReview/styles';

interface Props {
    amountMicroMinotari: number;
    destination: string;
    paymentId?: string | null;
    subtitle?: string;
}

/**
 * Amount + destination summary for the backend-driven approval prompts, so the user is
 * never asked to authorise a transaction they cannot see. Shared by the PIN dialog and
 * the transaction confirmation dialog.
 */
export function TransactionContextSummary({ amountMicroMinotari, destination, paymentId, subtitle }: Props) {
    const { t } = useTranslation('wallet');

    const entries: StatusListEntry[] = [
        {
            label: t('send.destination-address'),
            value: destination,
        },
        {
            label: t('send.transaction-description'),
            value: paymentId,
        },
    ];

    return (
        <Wrapper>
            <WhiteBox>
                <WhiteBoxLabel>{t('send.review-label')}</WhiteBoxLabel>
                <WhiteBoxValue>
                    <TariPurpleLogo />
                    <Amount>{formatNumber(amountMicroMinotari, FormatPreset.XTM_COMPACT)}</Amount>
                    <Currency>{`XTM`}</Currency>
                </WhiteBoxValue>
            </WhiteBox>
            <StatusList entries={entries} />
            {subtitle && (
                <Typography variant="p" style={{ opacity: 0.5, fontSize: 12 }}>
                    {subtitle}
                </Typography>
            )}
        </Wrapper>
    );
}
