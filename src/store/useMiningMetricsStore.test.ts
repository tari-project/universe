import { describe, it, expect, beforeEach } from 'vitest';
import { useMiningMetricsStore } from './useMiningMetricsStore';

describe('useMiningMetricsStore', () => {
    beforeEach(() => {
        useMiningMetricsStore.setState({
            gpu_devices: [],
            gpu_mining_status: {
                is_mining: false,
                hash_rate: 0,
                estimated_earnings: 0,
                is_available: true,
            },
            cpu_mining_status: {
                is_mining: false,
                hash_rate: 0,
                estimated_earnings: 0,
                connection: { is_connected: false },
            },
        });
    });

    describe('initial state', () => {
        it('has empty gpu_devices array', () => {
            expect(useMiningMetricsStore.getState().gpu_devices).toEqual([]);
        });

        describe('gpu_mining_status', () => {
            it('has is_mining as false', () => {
                expect(useMiningMetricsStore.getState().gpu_mining_status.is_mining).toBe(false);
            });

            it('has hash_rate as 0', () => {
                expect(useMiningMetricsStore.getState().gpu_mining_status.hash_rate).toBe(0);
            });

            it('has estimated_earnings as 0', () => {
                expect(useMiningMetricsStore.getState().gpu_mining_status.estimated_earnings).toBe(0);
            });

            it('has is_available as true', () => {
                expect(useMiningMetricsStore.getState().gpu_mining_status.is_available).toBe(true);
            });
        });

        describe('cpu_mining_status', () => {
            it('has is_mining as false', () => {
                expect(useMiningMetricsStore.getState().cpu_mining_status.is_mining).toBe(false);
            });

            it('has hash_rate as 0', () => {
                expect(useMiningMetricsStore.getState().cpu_mining_status.hash_rate).toBe(0);
            });

            it('has estimated_earnings as 0', () => {
                expect(useMiningMetricsStore.getState().cpu_mining_status.estimated_earnings).toBe(0);
            });

            it('has connection.is_connected as false', () => {
                expect(useMiningMetricsStore.getState().cpu_mining_status.connection.is_connected).toBe(false);
            });
        });
    });

    describe('gpu_devices updates', () => {
        it('can add a single GPU device', () => {
            const device = {
                device_id: 0,
                name: 'NVIDIA RTX 4090',
            };
            useMiningMetricsStore.setState({ gpu_devices: [device] });
            expect(useMiningMetricsStore.getState().gpu_devices).toHaveLength(1);
            expect(useMiningMetricsStore.getState().gpu_devices[0].name).toBe('NVIDIA RTX 4090');
        });

        it('can add multiple GPU devices', () => {
            const devices = [
                { device_id: 0, name: 'NVIDIA RTX 4090' },
                { device_id: 1, name: 'AMD RX 7900 XTX' },
            ];
            useMiningMetricsStore.setState({ gpu_devices: devices });
            expect(useMiningMetricsStore.getState().gpu_devices).toHaveLength(2);
        });

        it('can clear gpu_devices', () => {
            useMiningMetricsStore.setState({
                gpu_devices: [{ device_id: 0, name: 'Test GPU' }],
            });
            useMiningMetricsStore.setState({ gpu_devices: [] });
            expect(useMiningMetricsStore.getState().gpu_devices).toEqual([]);
        });
    });

    describe('gpu_mining_status updates', () => {
        it('can set is_mining to true', () => {
            useMiningMetricsStore.setState({
                gpu_mining_status: {
                    ...useMiningMetricsStore.getState().gpu_mining_status,
                    is_mining: true,
                },
            });
            expect(useMiningMetricsStore.getState().gpu_mining_status.is_mining).toBe(true);
        });

        it('can update hash_rate', () => {
            useMiningMetricsStore.setState({
                gpu_mining_status: {
                    ...useMiningMetricsStore.getState().gpu_mining_status,
                    hash_rate: 500000000,
                },
            });
            expect(useMiningMetricsStore.getState().gpu_mining_status.hash_rate).toBe(500000000);
        });

        it('can update estimated_earnings', () => {
            useMiningMetricsStore.setState({
                gpu_mining_status: {
                    ...useMiningMetricsStore.getState().gpu_mining_status,
                    estimated_earnings: 1000000,
                },
            });
            expect(useMiningMetricsStore.getState().gpu_mining_status.estimated_earnings).toBe(1000000);
        });

        it('can set is_available to false', () => {
            useMiningMetricsStore.setState({
                gpu_mining_status: {
                    ...useMiningMetricsStore.getState().gpu_mining_status,
                    is_available: false,
                },
            });
            expect(useMiningMetricsStore.getState().gpu_mining_status.is_available).toBe(false);
        });

        it('can update multiple fields at once', () => {
            useMiningMetricsStore.setState({
                gpu_mining_status: {
                    is_mining: true,
                    hash_rate: 750000000,
                    estimated_earnings: 2500000,
                    is_available: true,
                },
            });
            const status = useMiningMetricsStore.getState().gpu_mining_status;
            expect(status.is_mining).toBe(true);
            expect(status.hash_rate).toBe(750000000);
            expect(status.estimated_earnings).toBe(2500000);
            expect(status.is_available).toBe(true);
        });
    });

    describe('cpu_mining_status updates', () => {
        it('can set is_mining to true', () => {
            useMiningMetricsStore.setState({
                cpu_mining_status: {
                    ...useMiningMetricsStore.getState().cpu_mining_status,
                    is_mining: true,
                },
            });
            expect(useMiningMetricsStore.getState().cpu_mining_status.is_mining).toBe(true);
        });

        it('can update hash_rate', () => {
            useMiningMetricsStore.setState({
                cpu_mining_status: {
                    ...useMiningMetricsStore.getState().cpu_mining_status,
                    hash_rate: 25000,
                },
            });
            expect(useMiningMetricsStore.getState().cpu_mining_status.hash_rate).toBe(25000);
        });

        it('can update estimated_earnings', () => {
            useMiningMetricsStore.setState({
                cpu_mining_status: {
                    ...useMiningMetricsStore.getState().cpu_mining_status,
                    estimated_earnings: 50000,
                },
            });
            expect(useMiningMetricsStore.getState().cpu_mining_status.estimated_earnings).toBe(50000);
        });

        it('can update connection status', () => {
            useMiningMetricsStore.setState({
                cpu_mining_status: {
                    ...useMiningMetricsStore.getState().cpu_mining_status,
                    connection: { is_connected: true },
                },
            });
            expect(useMiningMetricsStore.getState().cpu_mining_status.connection.is_connected).toBe(true);
        });

        it('can update multiple fields at once', () => {
            useMiningMetricsStore.setState({
                cpu_mining_status: {
                    is_mining: true,
                    hash_rate: 30000,
                    estimated_earnings: 75000,
                    connection: { is_connected: true },
                },
            });
            const status = useMiningMetricsStore.getState().cpu_mining_status;
            expect(status.is_mining).toBe(true);
            expect(status.hash_rate).toBe(30000);
            expect(status.estimated_earnings).toBe(75000);
            expect(status.connection.is_connected).toBe(true);
        });
    });

    describe('mining state transitions', () => {
        it('tracks GPU mining start', () => {
            expect(useMiningMetricsStore.getState().gpu_mining_status.is_mining).toBe(false);

            useMiningMetricsStore.setState({
                gpu_mining_status: {
                    ...useMiningMetricsStore.getState().gpu_mining_status,
                    is_mining: true,
                    hash_rate: 500000000,
                },
            });

            expect(useMiningMetricsStore.getState().gpu_mining_status.is_mining).toBe(true);
            expect(useMiningMetricsStore.getState().gpu_mining_status.hash_rate).toBe(500000000);
        });

        it('tracks GPU mining stop', () => {
            useMiningMetricsStore.setState({
                gpu_mining_status: {
                    is_mining: true,
                    hash_rate: 500000000,
                    estimated_earnings: 1000000,
                    is_available: true,
                },
            });

            useMiningMetricsStore.setState({
                gpu_mining_status: {
                    is_mining: false,
                    hash_rate: 0,
                    estimated_earnings: 0,
                    is_available: true,
                },
            });

            expect(useMiningMetricsStore.getState().gpu_mining_status.is_mining).toBe(false);
            expect(useMiningMetricsStore.getState().gpu_mining_status.hash_rate).toBe(0);
        });

        it('tracks CPU mining start', () => {
            expect(useMiningMetricsStore.getState().cpu_mining_status.is_mining).toBe(false);

            useMiningMetricsStore.setState({
                cpu_mining_status: {
                    is_mining: true,
                    hash_rate: 25000,
                    estimated_earnings: 50000,
                    connection: { is_connected: true },
                },
            });

            expect(useMiningMetricsStore.getState().cpu_mining_status.is_mining).toBe(true);
            expect(useMiningMetricsStore.getState().cpu_mining_status.connection.is_connected).toBe(true);
        });

        it('tracks CPU mining stop', () => {
            useMiningMetricsStore.setState({
                cpu_mining_status: {
                    is_mining: true,
                    hash_rate: 25000,
                    estimated_earnings: 50000,
                    connection: { is_connected: true },
                },
            });

            useMiningMetricsStore.setState({
                cpu_mining_status: {
                    is_mining: false,
                    hash_rate: 0,
                    estimated_earnings: 0,
                    connection: { is_connected: false },
                },
            });

            expect(useMiningMetricsStore.getState().cpu_mining_status.is_mining).toBe(false);
            expect(useMiningMetricsStore.getState().cpu_mining_status.connection.is_connected).toBe(false);
        });
    });

    describe('complex state updates', () => {
        it('preserves GPU status when updating CPU status', () => {
            useMiningMetricsStore.setState({
                gpu_mining_status: {
                    is_mining: true,
                    hash_rate: 500000000,
                    estimated_earnings: 1000000,
                    is_available: true,
                },
            });

            useMiningMetricsStore.setState({
                cpu_mining_status: {
                    is_mining: true,
                    hash_rate: 25000,
                    estimated_earnings: 50000,
                    connection: { is_connected: true },
                },
            });

            expect(useMiningMetricsStore.getState().gpu_mining_status.is_mining).toBe(true);
            expect(useMiningMetricsStore.getState().cpu_mining_status.is_mining).toBe(true);
        });

        it('preserves devices when updating mining status', () => {
            useMiningMetricsStore.setState({
                gpu_devices: [{ device_index: 0, device_name: 'Test GPU' }] as any,
            });

            useMiningMetricsStore.setState({
                gpu_mining_status: {
                    is_mining: true,
                    hash_rate: 100000000,
                    estimated_earnings: 500000,
                    is_available: true,
                },
            });

            expect(useMiningMetricsStore.getState().gpu_devices).toHaveLength(1);
            expect(useMiningMetricsStore.getState().gpu_mining_status.is_mining).toBe(true);
        });
    });
});
