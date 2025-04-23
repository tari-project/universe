import { Button } from '@app/components/elements/buttons/Button';
import TariPurpleLogo from './icons/TariPurpleLogo';

import {
    Wrapper,
    WhiteBox,
    WhiteBoxLabel,
    WhiteBoxValue,
    Currency,
    ListWrapper,
    Entry,
    Label,
    Value,
    ValueRight,
    Amount,
    StatusHero,
    IconWrapper,
    TextWrapper,
    Title,
    Text,
} from './styles';
import { useTranslation } from 'react-i18next';
import { formatNumber, FormatPreset } from '@app/utils';
import { SendStatus } from '../Send';
import ProcessingIcon from './icons/ProcessingIcon';
import CompletedIcon from './icons/CompletedIcon';
import LoadingDots from './icons/LoadingDots';
import { useEffect } from 'react';

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
    networkFee,
    feePercentage,
    handleClose,
}: Props) {
    const { t } = useTranslation('wallet');

    useEffect(() => {
        let timer: NodeJS.Timeout;

        if (status === 'processing') {
            timer = setTimeout(() => {
                setStatus('completed');
            }, 5000);
        }

        return () => {
            if (timer) {
                clearTimeout(timer);
            }
        };
    }, [status, setStatus]);

    return (
        <Wrapper>
            {status === 'reviewing' ? (
                <>
                    <WhiteBox>
                        <WhiteBoxLabel>{t('send.review-label')}</WhiteBoxLabel>

                        <WhiteBoxValue>
                            <TariPurpleLogo />
                            <Amount>{formatNumber(amount || 0, FormatPreset.TXTM_LONG)}</Amount>
                            <Currency>{`XTM`}</Currency>
                        </WhiteBoxValue>
                    </WhiteBox>

                    <ListWrapper>
                        <Entry>
                            <Label>{t('send.destination-address')}</Label>
                            <Value>{address}</Value>
                        </Entry>

                        {message && (
                            <Entry>
                                <Label>{t('send.transaction-description')}</Label>
                                <Value>{message}</Value>
                            </Entry>
                        )}

                        <Entry>
                            <Label>{t('send.network-fee')}</Label>
                            <Value>
                                {networkFee} <ValueRight>{feePercentage}%</ValueRight>
                            </Value>
                        </Entry>

                        <Entry>
                            <Label>{t('send.estimated-completion-time')}</Label>
                            <Value>{`8 mins`}</Value>
                        </Entry>
                    </ListWrapper>

                    <Button
                        type="button"
                        fluid
                        size="xlarge"
                        variant="green"
                        onClick={() => {
                            setStatus('processing');
                        }}
                    >
                        {t('send.cta-confirm')}
                    </Button>
                </>
            ) : (
                <>
                    {status === 'processing' && (
                        <StatusHero>
                            <IconWrapper>
                                <ProcessingIcon />
                            </IconWrapper>
                            <TextWrapper>
                                <Title>{t('send.processing-title')}</Title>
                                <Text>{t('send.processing-text')}</Text>
                            </TextWrapper>
                        </StatusHero>
                    )}

                    {status === 'completed' && (
                        <StatusHero>
                            <IconWrapper>
                                <CompletedIcon />
                            </IconWrapper>
                            <TextWrapper>
                                <Title>{t('send.completed-title')}</Title>
                                <Text>
                                    {t('send.completed-text')}
                                    <br />
                                    <strong>{`1,000,000 XTM`}</strong> {t('send.completed-amount-sent')}{' '}
                                    <strong>{`0x12345..12789`}</strong>
                                    {`.`}
                                </Text>
                            </TextWrapper>
                        </StatusHero>
                    )}

                    <ListWrapper>
                        <Entry>
                            <Label>{t('send.status')}</Label>
                            <Value $status={status}>
                                {status === 'processing' ? t('send.processing') : t('send.completed')}
                            </Value>
                        </Entry>

                        <Entry>
                            <Label>{t('send.total-fees')}</Label>
                            <Value>0.03%</Value>
                        </Entry>

                        <Entry>
                            <Label>{t('send.destination-address')}</Label>
                            <Value>{address}</Value>
                        </Entry>

                        {message && (
                            <Entry>
                                <Label>{t('send.transaction-description')}</Label>
                                <Value>{message}</Value>
                            </Entry>
                        )}

                        <Entry>
                            <Label>{t('send.transaction-id')}</Label>
                            <Value>
                                {status === 'processing' && <LoadingDots />}
                                {status === 'completed' && `FXK8324SDAS`}
                            </Value>
                        </Entry>

                        <Entry>
                            <Label>{t('send.tari-txn')}</Label>
                            <Value>
                                {status === 'processing' && <LoadingDots />}
                                {status === 'completed' && `0x12345..12789`}
                            </Value>
                        </Entry>
                    </ListWrapper>

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
