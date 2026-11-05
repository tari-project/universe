import { invoke } from '@tauri-apps/api/core';
import { save } from '@tauri-apps/plugin-dialog';

export async function saveBurnProof(proofFile: string): Promise<boolean> {
    const defaultPath = proofFile.split(/[\\/]/).pop();
    const destination = await save({ defaultPath, filters: [{ name: 'JSON', extensions: ['json'] }] });
    if (!destination) return false;
    await invoke('save_burn_proof', { proofFile, destination });
    return true;
}
