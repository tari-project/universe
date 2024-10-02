import { Button } from '@app/components/elements/Button';
import { useAirdropStore } from '@app/store/useAirdropStore';
import { useAppConfigStore } from '@app/store/useAppConfigStore';

export default function AirdropLogout() {
    const airdropUIEnabled = useAppConfigStore((s) => s.airdrop_ui_enabled);
    const logout = useAirdropStore((state) => state.logout);
    const { userDetails } = useAirdropStore();

    if (!airdropUIEnabled || !userDetails) return null;
    return (
        <div style={{ maxWidth: 'fit-content', marginLeft: 'auto', padding: '20px' }}>
            <Button color="error" variant="text" size="medium" onClick={logout}>
                Disconnect from Airdrop
            </Button>
        </div>
    );
}
