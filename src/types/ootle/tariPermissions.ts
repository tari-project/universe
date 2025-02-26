import {
    TariPermission,
    TariPermissionAccountBalance,
    TariPermissionAccountInfo,
    TariPermissionAccountList,
    TariPermissionGetNft,
    TariPermissionKeyList,
    TariPermissionNftGetOwnershipProof,
    TariPermissionTransactionGet,
    TariPermissionTransactionSend,
} from '@tari-project/tari-permissions';

/* eslint-disable @typescript-eslint/no-explicit-any */
export function toPermission(permission: any): TariPermission {
    if (Object.prototype.hasOwnProperty.call(permission, 'AccountBalance')) {
        return new TariPermissionAccountBalance(permission.AccountBalance);
    } else if (permission === 'AccountInfo') {
        return new TariPermissionAccountInfo();
    } else if (Object.prototype.hasOwnProperty.call(permission, 'AccountList')) {
        return new TariPermissionAccountList(permission.AccountList);
    } else if (permission == 'KeyList') {
        return new TariPermissionKeyList();
    } else if (Object.prototype.hasOwnProperty.call(permission, 'TransactionSend')) {
        return new TariPermissionTransactionSend(permission.TransactionSend);
    } else if (permission === 'TransactionGet') {
        return new TariPermissionTransactionGet();
    } else if (Object.prototype.hasOwnProperty.call(permission, 'GetNft')) {
        return new TariPermissionGetNft(permission.GetNft);
    } else if (Object.prototype.hasOwnProperty.call(permission, 'NftGetOwnershipProof')) {
        return new TariPermissionNftGetOwnershipProof(permission.NftGetOwnershipProof);
    }
    return permission;
}
