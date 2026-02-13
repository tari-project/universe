/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { render } from '@app/test/test-utils';
import { McpSettings } from './McpSettings';

describe('McpSettings', () => {
    it('renders without crashing', () => {
        const { container } = render(<McpSettings />);
        expect(container).toBeTruthy();
    });
});
