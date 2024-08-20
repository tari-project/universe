import useWalletStore from '@app/store/walletStore.ts';

export default function useBalanceInfo() {
    const balance = useWalletStore((s) => s.balance);
    const pending_incoming_balance = useWalletStore((s) => s.pending_incoming_balance);
    const timelocked_balance = useWalletStore((s) => s.timelocked_balance);
    const available_balance = useWalletStore((s) => s.available_balance);

    console.log(`available_balance= ${available_balance}`);
    console.log(`pending_incoming_balance= ${pending_incoming_balance}`);
    console.log(`timelocked_balance= ${timelocked_balance}`);
    console.log(`total balance= ${balance}`);
}
