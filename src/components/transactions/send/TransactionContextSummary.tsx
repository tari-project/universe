import { useTranslation } from 'react-i18next';
import { Typography } from '@app/components/elements/Typography';
import { formatNumber, FormatPreset } from '@app/utils';
import { StatusList, StatusListEntry } from '../components/StatusList/StatusList';
import TariPurpleLogo from './SendReview/icons/TariPurpleLogo';
import { Amount, Currency, WhiteBox, WhiteBoxLabel, WhiteBoxValue, Wrapper } from './SendReview/styles';
import type { SpendKind } from '@app/types/events-payloads.ts';

interface Props {
    amountMicroMinotari: number;
    /** Recipient address for a send, L2 claim public key for a burn, Ootle address for an L2 send, burn commitment for an L2 claim. */
    destination: string;
    paymentId?: string | null;
    feeMicroMinotari?: number | null;
    subtitle?: string;
    kind?: SpendKind;
    /** For an abandon: picks the warning shown in place of `subtitle`. */
    abandon?: { accept_unreconcilable?: boolean; is_burn?: boolean };
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
    feeMicroMinotari,
    subtitle,
    kind = 'send',
    abandon,
}: Props) {
    const { t } = useTranslation('wallet');
    const isBurn = kind === 'burn';
    const isAbandon = kind === 'abandon';
    const note =
        !isAbandon || !abandon
            ? subtitle
            : abandon.accept_unreconcilable
              ? t('abandon.unreconcilable-note')
              : abandon.is_burn
                ? t('abandon.burn-note')
                : t('abandon.note');
    const isL2 = kind === 'l2_send' || kind === 'l2_claim';
    const destinationLabel = isBurn
        ? t('burn.claim-public-key')
        : isAbandon
          ? t('send.transaction-id')
          : kind === 'l2_claim'
            ? t('l2.claim.commitment')
            : isL2
              ? t('l2.send.address')
              : t('send.destination-address');

    const entries: StatusListEntry[] = [
        {
            label: destinationLabel,
            value: destination,
        },
        {
            label: t('send.transaction-description'),
            value: paymentId,
        },
        {
            label: t('send.network-fee'),
            value:
                feeMicroMinotari != null
                    ? `${formatNumber(feeMicroMinotari, FormatPreset.XTM_DECIMALS)} ${isL2 ? 'XTR' : 'XTM'}`
                    : null,
        },
    ];

    return (
        <Wrapper>
            <WhiteBox>
                <WhiteBoxLabel>
                    {isBurn
                        ? t('burn.review-label')
                        : isAbandon
                          ? t('abandon.review-label')
                          : kind === 'l2_claim'
                            ? t('l2.claim.review-label')
                            : t('send.review-label')}
                </WhiteBoxLabel>
                <WhiteBoxValue>
                    <TariPurpleLogo />
                    {/* L2 shows the exact amount being signed; L1 keeps its compact form. */}
                    <Amount>
                        {formatNumber(amountMicroMinotari, isL2 ? FormatPreset.XTM_DECIMALS : FormatPreset.XTM_COMPACT)}
                    </Amount>
                    <Currency>{isL2 ? `XTR` : `XTM`}</Currency>
                </WhiteBoxValue>
            </WhiteBox>
            <StatusList entries={entries} />
            {note && (
                <Typography variant="p" style={{ opacity: 0.5, fontSize: 12 }}>
                    {note}
                </Typography>
            )}
        </Wrapper>
    );
}
