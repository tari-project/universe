import path from 'path';
import { runGlobalSetup } from '../global-setup';
import { TEST_WALLET } from '../test-wallet';
import { installSwarm, mine, projectRoot, run, startSwarm } from './swarm';
import globalTeardown from './global-teardown';

export default async function globalSetup() {
    if (process.env.KEEP_TEST_DATA || process.env.SKIP_BACKEND) {
        throw new Error(
            'L2 tests require a wiped profile and their own backend. Unset KEEP_TEST_DATA and SKIP_BACKEND.'
        );
    }
    if (process.env.TARI_NETWORK && process.env.TARI_NETWORK !== 'localnet')
        throw new Error('L2 tests require TARI_NETWORK=localnet');
    try {
        const endpoints = await startSwarm();
        // Mine spendable coinbases directly to the app fixture, on the swarm's chain.
        // The miner exits after its fixed block budget; subsequent swarm mining matures them.
        const binaries = installSwarm();
        run(
            path.join(binaries, 'minotari_miner'),
            [
                '-b',
                path.join(projectRoot, 'playwright/test-results-l2/funding-miner'),
                '--network',
                'localnet',
                '--non-interactive',
                '--max-blocks=20',
                `-pminer.wallet_payment_address=${TEST_WALLET.address}`,
                `-pminer.base_node_grpc_address=${endpoints.baseNode}`,
                '-pminer.sha_p2pool_enabled=false',
                '-pminer.num_mining_threads=1',
            ],
            projectRoot,
            180_000
        );
        await mine(20);
        await runGlobalSetup({
            core: {
                node_type: 'Remote',
                remote_base_node_address: endpoints.baseNode,
                ootle_indexer_url: endpoints.indexer,
            },
            // A fresh swarm starts at genesis, before the common fixture's historical birthday.
            wallet: {
                tari_wallet_details: {
                    id: TEST_WALLET.walletId,
                    tari_address: TEST_WALLET.address,
                    wallet_birthday: 0,
                    spend_public_key_hex: TEST_WALLET.spendKeyHex,
                    view_private_key_hex: TEST_WALLET.viewKeyHex,
                },
            },
        });
    } catch (error) {
        await globalTeardown();
        throw error;
    }
}
