import { exec } from 'child_process';
import { promises as fs } from 'fs';
import { promisify } from 'util';

const execPromise = promisify(exec);

/**
 * Checks if a given path is located on a network-mounted volume on macOS.
 * This function is OS-specific and needs specific logic for other platforms.
 *
 * Root Cause Analysis:
 * The failure of custom node data location on macOS with NAS (SMB mounts)
 * is likely due to several factors:
 * 1. Atomicity of File Operations: Operations like recursive moves (`fs.renameSync` or similar
 *    implementations for directories) may not be atomic or fully supported across different
 *    file systems, especially network ones. A non-atomic move can fail mid-way,
 *    leaving the data in an inconsistent state.
 * 2. Permissions and Ownership: macOS applications often interact with network shares under
 *    different user contexts or permission mappings, leading to `EPERM` or `EACCES` errors
 *    during file system operations.
 * 3. Extended Attributes/Resource Forks: macOS files carry extended attributes. Moving these
 *    to non-macOS native file systems (like SMB) can cause issues if the remote server
 *    doesn't support them, leading to errors.
 * 4. Network Latency/Timeouts: Large data transfers over a network can be subject to
 *    intermittent connectivity issues or timeouts that are not handled gracefully by
 *    standard file system APIs.
 *
 * Chosen Approach:
 * Given the complexity and OS-specific challenges of ensuring robust, atomic, and performant
 * file system operations on various network mounts, the safest and most user-friendly approach
 * is to detect network paths and explicitly prevent the operation, providing a clear error
 * message. This avoids potential data corruption and provides a better user experience by
 * guiding them to use local storage.
 *
 * @param path The path to check.
 * @returns A Promise that resolves to true if the path is on a network volume (SMB, AFP, NFS, etc.) on macOS, false otherwise.
 *          Resolves to false immediately for non-macOS platforms.
 *          Rejects if a critical error occurs during the check (e.g., path doesn't exist, permission denied to run `mount`).
 */
export async function isPathOnNetworkVolume(path: string): Promise<boolean> {
    if (process.platform !== 'darwin') {
        // This fix is specific to macOS. For other platforms, we might need different checks
        // or return false by default if network volume checks aren't implemented.
        // TODO: Implement network volume detection for Windows and Linux if needed.
        return false;
    }

    try {
        // Ensure the path exists before querying mount info, otherwise realpath might fail.
        await fs.access(path);

        // Get the absolute path to handle symlinks and relative paths correctly
        const absolutePath = await fs.realpath(path);

        // Use the 'mount' command to get a list of mounted file systems and their types.
        // Example `mount` output on macOS:
        // /dev/disk1s1s1 on / (apfs, local, journaled)
        // //user@NAS-IP/ShareName on /Volumes/ShareName (smbfs, nodev, nosuid, synchronous)
        const { stdout: mountStdout, stderr: mountStderr } = await execPromise(`mount`);

        if (mountStderr) {
            console.warn(`[filesystem.ts] stderr from 'mount' command: ${mountStderr}`);
        }

        const mountLines = mountStdout.trim().split('\n');
        const networkFSTypes = ['smbfs', 'afpfs', 'nfs', 'cifs', 'fusefs']; // Common network/virtual FS types

        for (const line of mountLines) {
            // Match the mount point (e.g., '/Volumes/ShareName')
            const mountPointMatch = line.match(/ on (\/[^ ]+)/);
            if (mountPointMatch) {
                const mountPoint = mountPointMatch[1];

                // Check if the target path is on or within this mount point
                if (absolutePath === mountPoint || absolutePath.startsWith(`${mountPoint}/`)) {
                    // Check for common network filesystem types
                    const typeMatch = line.match(/\(([^,)]+),/); // Captures the first type in parentheses
                    if (typeMatch && networkFSTypes.includes(typeMatch[1])) {
                        return true; // Found a network filesystem type
                    }
                    // Specific heuristic for SMB: mount lines starting with '//' followed by user@server/share
                    if (line.startsWith('//')) {
                        return true; // Likely an SMB mount
                    }
                }
            }
        }

        return false; // No network mount detected for the given path
    } catch (error) {
        // Log the error but don't prevent the application from starting.
        // If we can't determine the mount status, we'll default to 'not network' for safety.
        // The UI should handle this scenario by potentially indicating that the path status
        // could not be verified, or allow the operation with a warning.
        console.error(`[filesystem.ts] Error checking path "${path}" for network volume status:`, error);
        // Default to false if the check itself fails, allowing the operation but perhaps with an implicit risk.
        // A more conservative approach would be to re-throw or return true (assume network on error)
        // but for a UI warning, false is safer than blocking valid local paths.
        return false;
    }
}
