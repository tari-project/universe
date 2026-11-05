import { invoke } from '@tauri-apps/api/core';
import { save } from '@tauri-apps/plugin-dialog';

export async function saveBurnProof(proofFile: string): Promise<'saved' | 'cancelled' | 'not-ready'> {
    if (!(await invoke<boolean>('burn_proof_ready', { proofFile }))) return 'not-ready';
    const defaultPath = proofFile.split(/[\\/]/).pop();
    const destination = await save({ defaultPath, filters: [{ name: 'JSON', extensions: ['json'] }] });
    if (!destination) return 'cancelled';
    await invoke('save_burn_proof', { proofFile, destination });
    return 'saved';
}
