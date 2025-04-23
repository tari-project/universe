import { HeaderWrapper, StatusWrapper, LoadingDots } from './SignMessage.styles';
import Metamask from '../../icons/mm-fox';
import { useEffect } from 'react';
import { setWalletConnectModalStep } from '@app/store/actions/walletStoreActions';
import { SwapStep } from '@app/store';

export const SignMessage = () => {
    useEffect(() => {
        setTimeout(() => {
            setWalletConnectModalStep(SwapStep.Swap);
        }, 5000);
    }, []);
    return (
        <>
            <HeaderWrapper>
                <Metamask width="65" />
                <h3>{'Sign the message on your mobile device'}</h3>
                <p>
                    {
                        'Approve this transaction using Metamask on your mobile device. Once it has been signed, your transaction will be processed.'
                    }
                </p>
            </HeaderWrapper>
            <StatusWrapper>
                <Metamask width="24" />
                <span>
                    {'Waiting for response'}
                    <LoadingDots />
                </span>
            </StatusWrapper>
        </>
    );
};
