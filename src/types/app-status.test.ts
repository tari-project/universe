import { describe, it, expect } from 'vitest';
import { SystemDependencyStatus } from './app-status';

describe('app-status types', () => {
    describe('SystemDependencyStatus enum', () => {
        it('has Installed value', () => {
            expect(SystemDependencyStatus.Installed).toBe('Installed');
        });

        it('has NotInstalled value', () => {
            expect(SystemDependencyStatus.NotInstalled).toBe('NotInstalled');
        });

        it('has Unknown value', () => {
            expect(SystemDependencyStatus.Unknown).toBe('Unknown');
        });
    });

    describe('TransactionInfo structure', () => {
        it('can create a complete transaction info object', () => {
            const tx = {
                tx_id: 123,
                source_address: 'source-addr-123',
                dest_address: 'dest-addr-456',
                status: 6,
                direction: 2,
                amount: 1000000,
                fee: 1000,
                is_cancelled: false,
                excess_sig: 'sig-abc123',
                timestamp: Date.now(),
                message: 'Test payment',
                payment_id: 'payment-789',
                mined_in_block_height: 12345,
                payment_reference: 'ref-001',
            };

            expect(tx.tx_id).toBe(123);
            expect(tx.amount).toBe(1000000);
            expect(tx.direction).toBe(2);
            expect(tx.mined_in_block_height).toBe(12345);
        });

        it('can create transaction info without optional fields', () => {
            const tx = {
                tx_id: 456,
                source_address: 'source',
                dest_address: 'dest',
                status: 0,
                direction: 1,
                amount: 500000,
                fee: 500,
                is_cancelled: false,
                excess_sig: 'sig',
                timestamp: Date.now(),
                message: '',
                payment_id: '',
            };

            expect(tx.tx_id).toBe(456);
            expect(tx.is_cancelled).toBe(false);
            expect(tx.payment_id).toBe('');
        });
    });

    describe('GpuDevice structure', () => {
        it('can create a GPU device object', () => {
            const device = {
                name: 'NVIDIA GeForce RTX 4090',
                device_id: 0,
            };

            expect(device.name).toBe('NVIDIA GeForce RTX 4090');
            expect(device.device_id).toBe(0);
        });
    });

    describe('CpuMinerStatus structure', () => {
        it('can create a CPU miner status object', () => {
            const status = {
                is_mining: true,
                hash_rate: 25000,
                estimated_earnings: 50000,
                connection: { is_connected: true },
            };

            expect(status.is_mining).toBe(true);
            expect(status.hash_rate).toBe(25000);
            expect(status.estimated_earnings).toBe(50000);
            expect(status.connection.is_connected).toBe(true);
        });

        it('can create a stopped CPU miner status', () => {
            const status = {
                is_mining: false,
                hash_rate: 0,
                estimated_earnings: 0,
                connection: { is_connected: false },
            };

            expect(status.is_mining).toBe(false);
            expect(status.hash_rate).toBe(0);
        });
    });

    describe('GpuMinerStatus structure', () => {
        it('can create a GPU miner status object', () => {
            const status = {
                is_mining: true,
                hash_rate: 500000000,
                estimated_earnings: 1000000,
                is_available: true,
            };

            expect(status.is_mining).toBe(true);
            expect(status.hash_rate).toBe(500000000);
            expect(status.is_available).toBe(true);
        });

        it('can create an unavailable GPU miner status', () => {
            const status = {
                is_mining: false,
                hash_rate: 0,
                estimated_earnings: 0,
                is_available: false,
            };

            expect(status.is_mining).toBe(false);
            expect(status.is_available).toBe(false);
        });
    });

    describe('PoolStats structure', () => {
        it('can create a pool stats object', () => {
            const stats = {
                accepted_shares: 1000,
                unpaid: 50000,
                balance: 150000,
                min_payout: 100000,
            };

            expect(stats.accepted_shares).toBe(1000);
            expect(stats.unpaid).toBe(50000);
            expect(stats.balance).toBe(150000);
            expect(stats.min_payout).toBe(100000);
        });
    });

    describe('TorConfig structure', () => {
        it('can create a Tor config object', () => {
            const config = {
                control_port: 9051,
                use_bridges: false,
                bridges: [],
            };

            expect(config.control_port).toBe(9051);
            expect(config.use_bridges).toBe(false);
            expect(config.bridges).toEqual([]);
        });

        it('can create a Tor config with bridges', () => {
            const config = {
                control_port: 9051,
                use_bridges: true,
                bridges: ['bridge1', 'bridge2', 'bridge3'],
            };

            expect(config.use_bridges).toBe(true);
            expect(config.bridges).toHaveLength(3);
        });
    });

    describe('SystemDependency structure', () => {
        it('can create a system dependency object', () => {
            const dep = {
                id: 'openCL',
                status: SystemDependencyStatus.Installed,
                download_url: 'https://example.com/download',
                ui_info: {
                    display_name: 'OpenCL',
                    display_description: 'OpenCL runtime for GPU mining',
                    manufacturer: {
                        name: 'Khronos Group',
                        logo_url: 'https://example.com/logo.png',
                        url: 'https://khronos.org',
                    },
                },
                required_by_app_modules: [],
            };

            expect(dep.id).toBe('openCL');
            expect(dep.status).toBe(SystemDependencyStatus.Installed);
            expect(dep.ui_info.display_name).toBe('OpenCL');
            expect(dep.ui_info.manufacturer.name).toBe('Khronos Group');
        });

        it('can create a not installed dependency', () => {
            const dep = {
                id: 'cudaRuntime',
                status: SystemDependencyStatus.NotInstalled,
                download_url: 'https://nvidia.com/cuda',
                ui_info: {
                    display_name: 'CUDA Runtime',
                    display_description: 'NVIDIA CUDA runtime',
                    manufacturer: {
                        name: 'NVIDIA',
                        logo_url: '',
                        url: 'https://nvidia.com',
                    },
                },
                required_by_app_modules: [],
            };

            expect(dep.status).toBe(SystemDependencyStatus.NotInstalled);
        });
    });
});
