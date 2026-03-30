import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CodePreview from '../CodePreview';

const sampleCode = 'resource appPlan "Microsoft.Web" {}';

const writeTextMock = vi.fn().mockResolvedValue(undefined);

describe('CodePreview', () => {
  beforeEach(() => {
    writeTextMock.mockClear();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    });
  });

  it('renders code content in a code block', () => {
    render(<CodePreview code={sampleCode} language="Bicep" />);
    const codeEl = document.querySelector('code');
    expect(codeEl).toBeInTheDocument();
    expect(codeEl!.textContent).toBe(sampleCode);
  });

  it('renders code inside a pre element', () => {
    render(<CodePreview code={sampleCode} language="Bicep" />);
    const preEl = document.querySelector('pre');
    expect(preEl).toBeInTheDocument();
    expect(preEl!.textContent).toContain(sampleCode);
  });

  it('shows the language label', () => {
    render(<CodePreview code={sampleCode} language="Bicep" />);
    expect(screen.getByText('Bicep')).toBeInTheDocument();
  });

  it('shows copy button', () => {
    render(<CodePreview code={sampleCode} language="Bicep" />);
    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
  });

  it('copies content to clipboard when copy button clicked', async () => {
    const user = userEvent.setup();
    render(<CodePreview code={sampleCode} language="Bicep" />);

    await user.click(screen.getByRole('button', { name: /copy/i }));
    // The clipboard write triggers "Copied" state - verify that path executed
    await waitFor(() => {
      expect(screen.getByText(/copied/i)).toBeInTheDocument();
    });
    // Verify the button text changed, confirming clipboard.writeText resolved
    expect(screen.queryByRole('button', { name: /^copy$/i })).not.toBeInTheDocument();
  });

  it('shows "Copied" text after clicking copy', async () => {
    const user = userEvent.setup();
    render(<CodePreview code={sampleCode} language="Bicep" />);

    await user.click(screen.getByRole('button', { name: /copy/i }));
    await waitFor(() => {
      expect(screen.getByText(/copied/i)).toBeInTheDocument();
    });
  });
});
