import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import StatusBadge from '../components/StatusBadge';
import TemplateCard from '../components/TemplateCard';
import type { Template, Deployment } from '../types';

describe('LoadingSpinner', () => {
  it('renders with default message', () => {
    render(<LoadingSpinner />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    render(<LoadingSpinner message="Fetching data..." />);
    expect(screen.getByText('Fetching data...')).toBeInTheDocument();
  });

  it('has role="status" for accessibility', () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});

describe('ErrorAlert', () => {
  it('renders the error message', () => {
    render(<ErrorAlert message="Something went wrong" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('has role="alert"', () => {
    render(<ErrorAlert message="Error" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders retry button when onRetry is provided', () => {
    const onRetry = vi.fn();
    render(<ErrorAlert message="Error" onRetry={onRetry} />);
    const retryButton = screen.getByRole('button', { name: /retry/i });
    expect(retryButton).toBeInTheDocument();
  });

  it('does not render retry button when onRetry is not provided', () => {
    render(<ErrorAlert message="Error" />);
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', async () => {
    const onRetry = vi.fn();
    render(<ErrorAlert message="Error" onRetry={onRetry} />);
    screen.getByRole('button', { name: /retry/i }).click();
    expect(onRetry).toHaveBeenCalledOnce();
  });
});

describe('StatusBadge', () => {
  const statuses: Deployment['status'][] = ['pending', 'in_progress', 'succeeded', 'failed'];
  const expectedLabels: Record<string, string> = {
    pending: 'Pending',
    in_progress: 'Deploying',
    succeeded: 'Succeeded',
    failed: 'Failed',
  };

  it.each(statuses)('renders correct label for "%s" status', (status) => {
    render(<StatusBadge status={status} />);
    expect(screen.getByText(expectedLabels[status])).toBeInTheDocument();
  });

  it.each(statuses)('applies badge-%s class for "%s" status', (status) => {
    const { container } = render(<StatusBadge status={status} />);
    const badge = container.querySelector('.badge');
    expect(badge).toHaveClass(`badge-${status}`);
  });
});

describe('TemplateCard', () => {
  const mockTemplate: Template = {
    id: 'test-template',
    name: 'Test Template',
    description: 'A test template for unit tests',
    category: 'Web',
    complexity: 'beginner',
    sourceUrl: 'https://example.com',
    services: ['App Service', 'SQL Database'],
    bicepPath: 'templates/bicep/test/main.bicep',
    workflowPath: 'templates/workflows/test/deploy.yml',
    parameters: [],
  };

  it('renders the template name', () => {
    render(
      <MemoryRouter>
        <TemplateCard template={mockTemplate} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Test Template')).toBeInTheDocument();
  });

  it('renders the template description', () => {
    render(
      <MemoryRouter>
        <TemplateCard template={mockTemplate} />
      </MemoryRouter>,
    );
    expect(screen.getByText('A test template for unit tests')).toBeInTheDocument();
  });

  it('renders the category badge', () => {
    render(
      <MemoryRouter>
        <TemplateCard template={mockTemplate} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Web')).toBeInTheDocument();
  });

  it('renders the complexity badge', () => {
    render(
      <MemoryRouter>
        <TemplateCard template={mockTemplate} />
      </MemoryRouter>,
    );
    expect(screen.getByText('beginner')).toBeInTheDocument();
  });

  it('renders the service count', () => {
    render(
      <MemoryRouter>
        <TemplateCard template={mockTemplate} />
      </MemoryRouter>,
    );
    expect(screen.getByText('2 Azure services')).toBeInTheDocument();
  });

  it('renders a link to the template detail page', () => {
    render(
      <MemoryRouter>
        <TemplateCard template={mockTemplate} />
      </MemoryRouter>,
    );
    const link = screen.getByRole('link', { name: /view details/i });
    expect(link).toHaveAttribute('href', '/templates/test-template');
  });
});
