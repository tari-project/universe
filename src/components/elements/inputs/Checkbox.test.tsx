/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@app/test/test-utils';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
    describe('user interactions', () => {
        it('calls handleChange when user clicks the checkbox', () => {
            const handleChange = vi.fn();
            render(
                <Checkbox id="test-checkbox" labelText="Accept terms" handleChange={handleChange} checked={false} />
            );

            fireEvent.click(screen.getByRole('checkbox'));

            expect(handleChange).toHaveBeenCalledWith(true);
        });

        it('toggles from checked to unchecked when user clicks', () => {
            const handleChange = vi.fn();
            render(<Checkbox id="test-checkbox" labelText="Accept terms" handleChange={handleChange} checked={true} />);

            fireEvent.click(screen.getByRole('checkbox'));

            expect(handleChange).toHaveBeenCalledWith(false);
        });

        it('can be toggled by pressing Space key', () => {
            const handleChange = vi.fn();
            render(<Checkbox id="test-checkbox" labelText="Subscribe" handleChange={handleChange} checked={false} />);

            const checkbox = screen.getByRole('checkbox');
            const focusableBox = checkbox.querySelector('[tabindex="0"]');
            expect(focusableBox).toBeInTheDocument();

            fireEvent.keyDown(focusableBox!, { key: ' ', code: 'Space' });

            expect(handleChange).toHaveBeenCalledWith(true);
        });

        it('can be toggled by pressing Enter key', () => {
            const handleChange = vi.fn();
            render(
                <Checkbox id="test-checkbox" labelText="Enable feature" handleChange={handleChange} checked={false} />
            );

            const checkbox = screen.getByRole('checkbox');
            const focusableBox = checkbox.querySelector('[tabindex="0"]');

            fireEvent.keyDown(focusableBox!, { key: 'Enter' });

            expect(handleChange).toHaveBeenCalledWith(true);
        });

        it('displays the label text that users can read', () => {
            const handleChange = vi.fn();
            render(<Checkbox id="test-checkbox" labelText="I agree to the terms" handleChange={handleChange} />);

            expect(screen.getByText('I agree to the terms')).toBeInTheDocument();
        });

        it('clicking the label text also toggles the checkbox', () => {
            const handleChange = vi.fn();
            render(<Checkbox id="test-checkbox" labelText="Remember me" handleChange={handleChange} checked={false} />);

            fireEvent.click(screen.getByText('Remember me'));

            expect(handleChange).toHaveBeenCalledWith(true);
        });
    });

    describe('accessibility', () => {
        it('has correct aria-checked attribute when unchecked', () => {
            const handleChange = vi.fn();
            render(<Checkbox id="test-checkbox" labelText="Option" handleChange={handleChange} checked={false} />);

            expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'false');
        });

        it('has correct aria-checked attribute when checked', () => {
            const handleChange = vi.fn();
            render(<Checkbox id="test-checkbox" labelText="Option" handleChange={handleChange} checked={true} />);

            expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'true');
        });

        it('has role="checkbox" for screen readers', () => {
            const handleChange = vi.fn();
            render(<Checkbox id="test-checkbox" handleChange={handleChange} />);

            expect(screen.getByRole('checkbox')).toBeInTheDocument();
        });

        it('contains a focusable element for keyboard navigation', () => {
            const handleChange = vi.fn();
            render(<Checkbox id="test-checkbox" labelText="Test" handleChange={handleChange} />);

            const checkbox = screen.getByRole('checkbox');
            const focusableElement = checkbox.querySelector('[tabindex="0"]');

            expect(focusableElement).toBeInTheDocument();
        });
    });

    describe('visual feedback', () => {
        it('shows check icon when checked', () => {
            const handleChange = vi.fn();
            render(<Checkbox id="test-checkbox" handleChange={handleChange} checked={true} />);

            const checkbox = screen.getByRole('checkbox');
            const svg = checkbox.querySelector('svg');

            expect(svg).toBeInTheDocument();
        });

        it('does not show check icon when unchecked', () => {
            const handleChange = vi.fn();
            render(<Checkbox id="test-checkbox" handleChange={handleChange} checked={false} />);

            const checkbox = screen.getByRole('checkbox');
            const svg = checkbox.querySelector('svg');

            expect(svg).not.toBeInTheDocument();
        });
    });

    describe('edge cases', () => {
        // TODO: POTENTIAL BUG - Checkbox silently fails when no id is provided
        // The component requires an id prop to function, but it's not marked as required
        // in the TypeScript interface. When clicked without an id, toggleChecked() returns
        // early and handleChange is never called, leaving the user with a non-functional checkbox.
        // See Checkbox.tsx line 50-51: if (!props.id) return;
        // Either:
        // 1. Make id a required prop in CheckboxInputProps, or
        // 2. Generate a unique id if not provided, or
        // 3. Don't rely on document.getElementById for state management
        it('does not throw when clicked without an id', () => {
            const handleChange = vi.fn();
            render(<Checkbox handleChange={handleChange} labelText="No ID" />);

            expect(() => {
                fireEvent.click(screen.getByRole('checkbox'));
            }).not.toThrow();

            // BUG: handleChange should be called but isn't because no id was provided
            expect(handleChange).not.toHaveBeenCalled();
        });

        it('handles undefined checked prop as false', () => {
            const handleChange = vi.fn();
            render(<Checkbox id="test-checkbox" handleChange={handleChange} />);

            expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'false');
        });
    });
});
