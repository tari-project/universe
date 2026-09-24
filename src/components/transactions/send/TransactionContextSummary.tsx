import { useTranslation } from 'react-i18next';
import { Typography } from '@app/components/elements/Typography';
import { formatNumber, FormatPreset } from '@app/utils';
import { StatusList, StatusListEntry } from '../components/StatusList/StatusList';
import TariPurpleLogo from './SendReview/icons/TariPurpleLogo';
import { Amount, Currency, WhiteBox, WhiteBoxLabel, WhiteBoxValue, Wrapper } from './SendReview/styles';
import type { SpendKind } from '@app/types/events-payloads.ts';

interface Props {
    amountMicroMinotari: number;
    /** Recipient address for a send, L2 claim public key for a burn. */
    destination: string;
    paymentId?: string | null;
    subtitle?: string;
    kind?: SpendKind;
}

/**
 * Amount + destination summary for the backend-driven approval prompts, so the user is
 * never asked to authorise a transaction they cannot see. Shared by the PIN dialog and
 * the transaction confirmation dialog.
 */
export function TransactionContextSummary({
    amountMicroMinotari,
    destination,
    paymentId,
    subtitle,
    kind = 'send',
}: Props) {
    const { t } = useTranslation('wallet');
    const isBurn = kind === 'burn';

    const entries: StatusListEntry[] = [
        {
            label: isBurn ? t('burn.claim-public-key') : t('send.destination-address'),
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
                <WhiteBoxLabel>{isBurn ? t('burn.review-label') : t('send.review-label')}</WhiteBoxLabel>
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
