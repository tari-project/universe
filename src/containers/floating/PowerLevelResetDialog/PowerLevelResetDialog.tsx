/* eslint-disable i18next/no-literal-string */

import { useUIStore } from '@app/store/useUIStore';

import { DialogContent, Dialog } from '@app/components/elements/dialog/Dialog';
import { useCallback } from 'react';

export default function PowerLevelResetDialog() {
    const open = useUIStore((s) => s.dialogToShow === 'powerLevelReset');
    const setDialogToShow = useUIStore((s) => s.setDialogToShow);

    const handleClose = useCallback(() => {
        setDialogToShow(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Dialog open={open} onOpenChange={handleClose} disableClose>
            <DialogContent>Poops</DialogContent>
        </Dialog>
    );
}
