import { useContext, useEffect } from 'react';
import { PortalSdkContext, PortalSdkInstance } from './PortalSdkProvider';

export interface UseSdkResult {
    sdk: PortalSdkInstance | null;
    isSdkLoading: boolean;
    sdkError: Error | null;
}

export interface PortalSdkEventCallbacks {
    error?: (error: Error) => void;
    swapMatched?: (swap: any) => void; // Replace 'any' with actual Swap type
    swapHolderInvoiced?: (swap: any) => void; // Replace 'any' with actual Swap type
    swapSeekerInvoiced?: (swap: any) => void; // Replace 'any' with actual Swap type
    swapHolderPaid?: (swap: any) => void; // Replace 'any' with actual Swap type
    swapSeekerPaid?: (swap: any) => void; // Replace 'any' with actual Swap type
}

const usePortalSdk = (callbacks?: PortalSdkEventCallbacks): UseSdkResult => {
    const context = useContext(PortalSdkContext);

    if (context === undefined) {
        throw new Error('useSdk must be used within an SdkProvider');
    }

    const { sdk, isSdkLoading, sdkError } = context;

    useEffect(() => {
        const { error, swapMatched, swapHolderInvoiced, swapSeekerInvoiced, swapHolderPaid, swapSeekerPaid } =
            callbacks || {};

        if (sdk) {
            if (error) {
                sdk.on('error', error);
            }
            if (swapMatched) {
                sdk.on('swapMatched', swapMatched);
            }
            if (swapHolderInvoiced) {
                sdk.on('swapHolderInvoiced', swapHolderInvoiced);
            }
            if (swapSeekerInvoiced) {
                sdk.on('swapSeekerInvoiced', swapSeekerInvoiced);
            }
            if (swapHolderPaid) {
                sdk.on('swapHolderPaid', swapHolderPaid);
            }
            if (swapSeekerPaid) {
                sdk.on('swapSeekerPaid', swapSeekerPaid);
            }
        }

        return () => {
            if (sdk) {
                if (error) {
                    sdk.off('error', error);
                }
                if (swapMatched) {
                    sdk.off('swapMatched', swapMatched);
                }
                if (swapHolderInvoiced) {
                    sdk.off('swapHolderInvoiced', swapHolderInvoiced);
                }
                if (swapSeekerInvoiced) {
                    sdk.off('swapSeekerInvoiced', swapSeekerInvoiced);
                }
                if (swapHolderPaid) {
                    sdk.off('swapHolderPaid', swapHolderPaid);
                }
                if (swapSeekerPaid) {
                    sdk.off('swapSeekerPaid', swapSeekerPaid);
                }
            }
        };
    }, [sdk, callbacks]);

    return {
        sdk,
        isSdkLoading,
        sdkError,
    };
};

export default usePortalSdk;
