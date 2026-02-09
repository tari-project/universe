/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@app/test/test-utils';
import { Button } from './Button';

describe('Button', () => {
    describe('user interactions', () => {
        it('calls onClick when user clicks the button', () => {
            const onClick = vi.fn();
            render(<Button onClick={onClick}>Click me</Button>);

            fireEvent.click(screen.getByRole('button', { name: 'Click me' }));

            expect(onClick).toHaveBeenCalledTimes(1);
        });

        it('does not call onClick when disabled', () => {
            const onClick = vi.fn();
            render(
                <Button onClick={onClick} disabled>
                    Disabled
                </Button>
            );

            fireEvent.click(screen.getByRole('button', { name: 'Disabled' }));

            expect(onClick).not.toHaveBeenCalled();
        });

        it('displays button text that users can read', () => {
            render(<Button>Submit</Button>);

            expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
        });

        it('can be focused via keyboard', () => {
            render(<Button>Focus me</Button>);

            const button = screen.getByRole('button', { name: 'Focus me' });
            button.focus();

            expect(button).toHaveFocus();
        });
    });

    describe('button states', () => {
        it('can be disabled', () => {
            render(<Button disabled>Disabled Button</Button>);

            expect(screen.getByRole('button')).toBeDisabled();
        });

        it('renders in loading state', () => {
            const loader = <span data-testid="loader">Loading...</span>;
            render(
                <Button isLoading loader={loader}>
                    Submit
                </Button>
            );

            expect(screen.getByTestId('loader')).toBeInTheDocument();
        });

        it('shows both text and loader when loading', () => {
            const loader = <span data-testid="loader">...</span>;
            render(
                <Button isLoading loader={loader}>
                    Saving
                </Button>
            );

            expect(screen.getByText('Saving')).toBeInTheDocument();
            expect(screen.getByTestId('loader')).toBeInTheDocument();
        });
    });

    describe('variants', () => {
        it('renders primary variant by default', () => {
            render(<Button>Primary</Button>);

            expect(screen.getByRole('button', { name: 'Primary' })).toBeInTheDocument();
        });

        it('renders secondary variant', () => {
            render(<Button variant="secondary">Secondary</Button>);

            expect(screen.getByRole('button', { name: 'Secondary' })).toBeInTheDocument();
        });

        it('renders outlined variant', () => {
            render(<Button variant="outlined">Outlined</Button>);

            expect(screen.getByRole('button', { name: 'Outlined' })).toBeInTheDocument();
        });

        it('renders gradient variant', () => {
            render(<Button variant="gradient">Gradient</Button>);

            expect(screen.getByRole('button', { name: 'Gradient' })).toBeInTheDocument();
        });
    });

    describe('sizes', () => {
        it('renders medium size by default', () => {
            render(<Button>Medium</Button>);

            expect(screen.getByRole('button', { name: 'Medium' })).toBeInTheDocument();
        });

        it('renders small size', () => {
            render(<Button size="small">Small</Button>);

            expect(screen.getByRole('button', { name: 'Small' })).toBeInTheDocument();
        });

        it('renders large size', () => {
            render(<Button size="large">Large</Button>);

            expect(screen.getByRole('button', { name: 'Large' })).toBeInTheDocument();
        });
    });

    describe('icons', () => {
        it('renders icon at start position', () => {
            const icon = <span data-testid="icon">★</span>;
            render(
                <Button icon={icon} iconPosition="start">
                    With Icon
                </Button>
            );

            expect(screen.getByTestId('icon')).toBeInTheDocument();
            expect(screen.getByText('With Icon')).toBeInTheDocument();
        });

        it('renders icon at end position', () => {
            const icon = <span data-testid="icon">→</span>;
            render(
                <Button icon={icon} iconPosition="end">
                    Continue
                </Button>
            );

            expect(screen.getByTestId('icon')).toBeInTheDocument();
        });

        it('renders icon at hug-start position', () => {
            const icon = <span data-testid="icon">◆</span>;
            render(
                <Button icon={icon} iconPosition="hug-start">
                    Action
                </Button>
            );

            expect(screen.getByTestId('icon')).toBeInTheDocument();
        });

        it('does not show loader when icon is present during loading', () => {
            const icon = <span data-testid="icon">✓</span>;
            const loader = <span data-testid="loader">...</span>;
            render(
                <Button icon={icon} iconPosition="end" isLoading loader={loader}>
                    Saving
                </Button>
            );

            expect(screen.getByTestId('icon')).toBeInTheDocument();
            expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
        });
    });

    describe('accessibility', () => {
        it('has role="button"', () => {
            render(<Button>Accessible</Button>);

            expect(screen.getByRole('button')).toBeInTheDocument();
        });

        it('is keyboard accessible when not disabled', () => {
            render(<Button>Tab to me</Button>);

            const button = screen.getByRole('button');
            expect(button).not.toHaveAttribute('tabIndex', '-1');
        });

        it('accepts custom aria attributes', () => {
            render(<Button aria-label="Custom label">Icon</Button>);

            expect(screen.getByRole('button', { name: 'Custom label' })).toBeInTheDocument();
        });

        it('accepts type attribute', () => {
            render(<Button type="submit">Submit Form</Button>);

            expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
        });
    });

    describe('fluid layout', () => {
        it('renders with fluid prop', () => {
            render(<Button fluid>Full Width</Button>);

            expect(screen.getByRole('button', { name: 'Full Width' })).toBeInTheDocument();
        });
    });
});
