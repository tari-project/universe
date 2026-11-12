import { useCallback, useState } from 'react';
import { FormProvider, useForm, useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';

import TransactionModal from '@app/components/TransactionModal/TransactionModal.tsx';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { TariOutlineSVG } from '@app/assets/icons/tari-outline.tsx';
import { FormField } from '@app/components/transactions/send/FormField.tsx';
import type { SendInputs } from '@app/components/transactions/send/types.ts';
import type { SendStatus } from '@app/components/transactions/send/SendModal.tsx';
import {
    BottomWrapper,
    FormFieldsWrapper,
    MiniButton,
    StyledForm,
    Wrapper,
} from '@app/components/transactions/send/Send.styles.ts';
import { FormRootError } from '@app/components/transactions/send/FormRootError.tsx';
import { TransactionContextSummary } from '@app/components/transactions/send/TransactionContextSummary.tsx';
import { StatusHero } from '@app/components/transactions/components/StatusHero/StatusHero';
import { StatusList, StatusListEntry } from '@app/components/transactions/components/StatusList/StatusList';
import ProcessingIcon from '@app/components/transactions/send/SendReview/icons/ProcessingIcon';
import CompletedIcon from '@app/components/transactions/send/SendReview/icons/CompletedIcon';
import { setError as setStoreError } from '@app/store';
import { PIN_CANCELLED_RE } from '@app/store/actions/l2WalletStoreActions.ts';
import type { L2Conversion } from '@app/types/events-payloads.ts';
import { formatNumber, FormatPreset } from '@app/utils';

interface L2ConvertModalProps {
    conversion: L2Conversion;
    /** Component address of the account whose funds move. */
    account: string;
    /** The account's own Ootle address, which the conversion pays. */
    address: string;
    /** Micro TARI on the side being converted: revealed for a shield, confidential for an unshield. */
    available: number;
    onClose: () => void;
}

const defaultValues: SendInputs = { address: '', amount: undefined };

const toMicro = (amount: SendInputs['amount']) => Math.round(Number(amount || 0) * 1_000_000);

/** Translation keys by direction, spelled out so the i18n checks can find them. */
const COPY = {
    shield: {
        title: 'l2.shield.title',
        reviewTitle: 'l2.shield.review-title',
        available: 'l2.shield.available',
        feeNote: 'l2.shield.fee-note',
        ctaConfirm: 'l2.shield.cta-confirm',
        processingTitle: 'l2.shield.processing-title',
        errorMessage: 'l2.shield.error-message',
    },
    unshield: {
        title: 'l2.unshield.title',
        reviewTitle: 'l2.unshield.review-title',
        available: 'l2.unshield.available',
        feeNote: 'l2.unshield.fee-note',
        ctaConfirm: 'l2.unshield.cta-confirm',
        processingTitle: 'l2.unshield.processing-title',
        errorMessage: 'l2.unshield.error-message',
    },
} as const satisfies Record<L2Conversion, Record<string, string>>;

function L2ConvertForm({ conversion, account, available }: Omit<L2ConvertModalProps, 'address' | 'onClose'>) {
    const { t } = useTranslation('wallet');
    const { control, formState, setError, setValue, clearErrors } = useFormContext<SendInputs>();
    const { isSubmitting, errors } = formState;
    const amount = useWatch({ control, name: 'amount' });
    const [isFetchingMax, setIsFetchingMax] = useState(false);
    const isValid = Number(amount) > 0 && toMicro(amount) <= available && !errors.amount;

    function checkAmount() {
        if (amount === undefined || `${amount}`.trim() === '') return;
        if (!(Number(amount) > 0)) {
            setError('amount', { message: t('send.error-invalid-amount') });
        } else if (toMicro(amount) > available) {
            setError('amount', { message: t('l2.convert.error-over-balance') });
        } else {
            clearErrors('amount');
        }
    }

    // The backend prices a conversion of everything on that side and takes the fee off it.
    async function handleMax() {
        setIsFetchingMax(true);
        try {
            const max = await invoke<number>('l2_max_conversion', { account, conversion });
            setValue('amount', max / 1_000_000, { shouldValidate: true });
            clearErrors('amount');
        } catch (error) {
            console.error(`Could not get the most this account can ${conversion}:`, error);
            setError('amount', { message: t('send.error-max-unavailable') });
        } finally {
            setIsFetchingMax(false);
        }
    }

    return (
        <>
            <FormFieldsWrapper>
                <FormField
                    control={control}
                    name="amount"
                    onBlur={checkAmount}
                    required
                    autoFocus
                    icon={<TariOutlineSVG />}
                    errorText={errors.amount?.message}
                    secondaryText={`${t(COPY[conversion].available)} ${formatNumber(available, FormatPreset.XTM_DECIMALS)} TARI`}
                    miniButton={
                        <MiniButton
                            variant="outlined"
                            size="xs"
                            color="grey"
                            backgroundColor="transparent"
                            type="button"
                            disabled={isFetchingMax || available === 0}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                void handleMax();
                            }}
                            data-testid="l2-convert-max-button"
                        >
                            {t('send.max')}
                        </MiniButton>
                    }
                />
            </FormFieldsWrapper>
            <BottomWrapper>
                <Button
                    disabled={isSubmitting || isFetchingMax || !isValid}
                    type="submit"
                    fluid
                    variant="green"
                    size="xlarge"
                    data-testid="l2-convert-review-button"
                >
                    {t('l2.send.cta-review')}
                </Button>
            </BottomWrapper>
        </>
    );
}

/** Shields (revealed to confidential) or unshields (confidential to revealed) the account's own TARI. */
export default function L2ConvertModal({ conversion, account, address, available, onClose }: L2ConvertModalProps) {
    const { t } = useTranslation('wallet');
    const [status, setStatus] = useState<SendStatus>('fields');
    const [txId, setTxId] = useState<string | null>(null);
    const methods = useForm<SendInputs>({ defaultValues, mode: 'all' });
    const { reset, setError } = methods;

    function handleClose() {
        reset();
        setTxId(null);
        setStatus('fields');
        onClose();
    }

    const handleFormSubmit = useCallback(
        async (data: SendInputs) => {
            if (status === 'fields') {
                setStatus('reviewing');
                return;
            }
            setStatus('processing');
            try {
                const id = await invoke<string>(conversion === 'shield' ? 'l2_shield' : 'l2_unshield', {
                    account,
                    amount: `${data.amount}`,
                });
                setTxId(id);
                setStatus('completed');
            } catch (error) {
                const message = `${error}`;
                if (PIN_CANCELLED_RE.test(message)) {
                    setError('root.invoke_error', { message: t('send.error-denied') });
                } else {
                    const text = `${t(COPY[conversion].errorMessage)}${message}`;
                    setStoreError(text);
                    setError('root.invoke_error', { message: text });
                }
                setStatus('fields');
            }
        },
        [status, conversion, account, setError, t]
    );

    const values = methods.getValues();
    const kind = conversion === 'shield' ? 'l2_shield' : 'l2_unshield';

    const statusEntries: StatusListEntry[] = [
        {
            label: t('send.status'),
            value: status === 'processing' ? t('send.processing') : t('send.broadcast'),
            status,
        },
        { label: t('send.transaction-id'), value: txId },
    ];

    const title =
        status === 'fields'
            ? t(COPY[conversion].title)
            : status === 'reviewing'
              ? t(COPY[conversion].reviewTitle)
              : undefined;

    return (
        <TransactionModal
            show
            title={title}
            handleClose={status !== 'reviewing' ? handleClose : undefined}
            handleBack={status === 'reviewing' ? () => setStatus('fields') : undefined}
        >
            <FormProvider {...methods}>
                <Wrapper $isLoading={methods.formState.isSubmitting}>
                    <StyledForm
                        onSubmit={methods.handleSubmit(handleFormSubmit)}
                        data-testid={`l2-${conversion}-modal`}
                    >
                        <FormRootError />
                        {status === 'fields' && (
                            <L2ConvertForm conversion={conversion} account={account} available={available} />
                        )}
                        {status === 'reviewing' && (
                            <>
                                <TransactionContextSummary
                                    kind={kind}
                                    amountMicroMinotari={toMicro(values.amount)}
                                    destination={address}
                                    subtitle={t(COPY[conversion].feeNote)}
                                />
                                <Button
                                    type="submit"
                                    fluid
                                    size="xlarge"
                                    variant="green"
                                    data-testid="l2-convert-confirm-button"
                                >
                                    {t(COPY[conversion].ctaConfirm)}
                                </Button>
                            </>
                        )}
                        {(status === 'processing' || status === 'completed') && (
                            <div data-testid="l2-convert-status">
                                {status === 'processing' ? (
                                    <StatusHero icon={<ProcessingIcon />} title={t(COPY[conversion].processingTitle)}>
                                        {t('l2.send.processing-text')}
                                    </StatusHero>
                                ) : (
                                    <StatusHero icon={<CompletedIcon />} title={t('l2.send.completed-title')}>
                                        {t('l2.send.completed-text')}
                                    </StatusHero>
                                )}
                                <StatusList entries={statusEntries} />
                                <Button
                                    type="button"
                                    fluid
                                    size="xlarge"
                                    variant="purple"
                                    disabled={status === 'processing'}
                                    onClick={handleClose}
                                    data-testid="l2-convert-done-button"
                                >
                                    {status === 'processing' ? t('send.processing-button') : t('send.done-button')}
                                </Button>
                            </div>
                        )}
                    </StyledForm>
                </Wrapper>
            </FormProvider>
        </TransactionModal>
    );
}
