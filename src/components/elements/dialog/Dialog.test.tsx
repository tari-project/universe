/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@app/test/test-utils';
import { Dialog, DialogContent } from './Dialog';

describe('Dialog', () => {
    describe('visibility', () => {
        it('shows dialog content when open is true', async () => {
            render(
                <Dialog open onOpenChange={vi.fn()}>
                    <DialogContent>
                        <p>Dialog content</p>
                    </DialogContent>
                </Dialog>
            );

            await waitFor(() => {
                expect(screen.getByText('Dialog content')).toBeInTheDocument();
            });
        });

        it('does not show content when open is false', () => {
            render(
                <Dialog open={false} onOpenChange={vi.fn()}>
                    <DialogContent>
                        <p>Hidden content</p>
                    </DialogContent>
                </Dialog>
            );

            expect(screen.queryByText('Hidden content')).not.toBeInTheDocument();
        });
    });

    describe('user interactions', () => {
        it('calls onOpenChange when overlay is clicked', async () => {
            const onOpenChange = vi.fn();
            render(
                <Dialog open onOpenChange={onOpenChange}>
                    <DialogContent>
                        <p>Click outside to close</p>
                    </DialogContent>
                </Dialog>
            );

            await waitFor(() => {
                expect(screen.getByText('Click outside to close')).toBeInTheDocument();
            });

            const overlay = document.querySelector('.overlay');
            if (overlay) {
                fireEvent.mouseDown(overlay);
            }

            expect(onOpenChange).toHaveBeenCalled();
        });

        it('does not close when disableClose is true', async () => {
            const onOpenChange = vi.fn();
            render(
                <Dialog open onOpenChange={onOpenChange} disableClose>
                    <DialogContent>
                        <p>Cannot be closed</p>
                    </DialogContent>
                </Dialog>
            );

            await waitFor(() => {
                expect(screen.getByText('Cannot be closed')).toBeInTheDocument();
            });

            const overlay = document.querySelector('.overlay');
            if (overlay) {
                fireEvent.mouseDown(overlay);
            }

            expect(onOpenChange).not.toHaveBeenCalled();
        });
    });

    describe('close button', () => {
        it('renders close button when provided', async () => {
            render(
                <Dialog open onOpenChange={vi.fn()}>
                    <DialogContent closeButton={<button data-testid="close-btn">×</button>}>
                        <p>With close button</p>
                    </DialogContent>
                </Dialog>
            );

            await waitFor(() => {
                expect(screen.getByTestId('close-btn')).toBeInTheDocument();
            });
        });

        it('close button can be clicked', async () => {
            const handleClose = vi.fn();
            render(
                <Dialog open onOpenChange={vi.fn()}>
                    <DialogContent
                        closeButton={
                            <button data-testid="close-btn" onClick={handleClose}>
                                ×
                            </button>
                        }
                    >
                        <p>Closeable dialog</p>
                    </DialogContent>
                </Dialog>
            );

            await waitFor(() => {
                expect(screen.getByTestId('close-btn')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByTestId('close-btn'));

            expect(handleClose).toHaveBeenCalledTimes(1);
        });
    });

    describe('variants', () => {
        it('renders primary variant by default', async () => {
            render(
                <Dialog open onOpenChange={vi.fn()}>
                    <DialogContent>
                        <p>Primary dialog</p>
                    </DialogContent>
                </Dialog>
            );

            await waitFor(() => {
                expect(screen.getByText('Primary dialog')).toBeInTheDocument();
            });
        });

        it('renders wrapper variant', async () => {
            render(
                <Dialog open onOpenChange={vi.fn()}>
                    <DialogContent variant="wrapper">
                        <p>Wrapper dialog</p>
                    </DialogContent>
                </Dialog>
            );

            await waitFor(() => {
                expect(screen.getByText('Wrapper dialog')).toBeInTheDocument();
            });
        });
    });

    describe('accessibility', () => {
        it('has aria-labelledby attribute', async () => {
            render(
                <Dialog open onOpenChange={vi.fn()}>
                    <DialogContent>
                        <h2>Dialog Title</h2>
                        <p>Dialog body</p>
                    </DialogContent>
                </Dialog>
            );

            await waitFor(() => {
                expect(screen.getByText('Dialog Title')).toBeInTheDocument();
            });

            const dialogContent = screen.getByText('Dialog body').closest('[aria-labelledby]');
            expect(dialogContent).toHaveAttribute('aria-labelledby');
        });

        it('has aria-describedby attribute', async () => {
            render(
                <Dialog open onOpenChange={vi.fn()}>
                    <DialogContent>
                        <p>Description content</p>
                    </DialogContent>
                </Dialog>
            );

            await waitFor(() => {
                expect(screen.getByText('Description content')).toBeInTheDocument();
            });

            const dialogContent = screen.getByText('Description content').closest('[aria-describedby]');
            expect(dialogContent).toHaveAttribute('aria-describedby');
        });
    });

    describe('content rendering', () => {
        it('renders children inside dialog', async () => {
            render(
                <Dialog open onOpenChange={vi.fn()}>
                    <DialogContent>
                        <h1>Title</h1>
                        <p>Body text</p>
                        <button>Action</button>
                    </DialogContent>
                </Dialog>
            );

            await waitFor(() => {
                expect(screen.getByRole('heading', { name: 'Title' })).toBeInTheDocument();
            });
            expect(screen.getByText('Body text')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
        });

        it('renders with custom content structure', async () => {
            render(
                <Dialog open onOpenChange={vi.fn()}>
                    <DialogContent>
                        <form data-testid="dialog-form">
                            <input type="text" placeholder="Enter name" />
                            <button type="submit">Submit</button>
                        </form>
                    </DialogContent>
                </Dialog>
            );

            await waitFor(() => {
                expect(screen.getByTestId('dialog-form')).toBeInTheDocument();
            });
            expect(screen.getByPlaceholderText('Enter name')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
        });
    });
});
