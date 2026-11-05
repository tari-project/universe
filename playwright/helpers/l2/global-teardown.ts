import stopApp from '../global-teardown';
import { stopSwarm } from './swarm';

export default async function globalTeardown() {
    try {
        await stopApp();
    } finally {
        await stopSwarm();
    }
}
