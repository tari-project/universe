import { Button } from '@app/components/elements/Button';
import { useAirdropStore } from '@app/store/useAirdropStore';

export default function AirdropLogout() {
    const wipUI = useAirdropStore((state) => state.wipUI);
    const logout = useAirdropStore((state) => state.logout);
    const { userDetails } = useAirdropStore();

    if (!wipUI || !userDetails) return null;
    return (
        <div style={{ maxWidth: 'fit-content', marginLeft: 'auto', padding: '20px' }}>
            <Button color="error" variant="text" size="medium" onClick={logout}>
                Disconnect from Airdrop
            </Button>
        </div>
    );
}
