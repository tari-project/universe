/**
 * Test utilities for component testing with proper providers.
 * Provides a custom render function that wraps components with ThemeProvider.
 */
import '@testing-library/jest-dom/vitest';
import { ReactNode } from 'react';
import { render, RenderOptions, cleanup } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { lightTheme } from '@app/theme/themes';
import { afterEach } from 'vitest';

afterEach(() => {
    cleanup();
});

interface WrapperProps {
    children: ReactNode;
}

function AllProviders({ children }: WrapperProps) {
    return <ThemeProvider theme={lightTheme}>{children}</ThemeProvider>;
}

function customRender(ui: React.ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
    return render(ui, { wrapper: AllProviders, ...options });
}

export * from '@testing-library/react';
export { customRender as render };
