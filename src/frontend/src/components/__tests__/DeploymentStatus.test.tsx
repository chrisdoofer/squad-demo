import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import DeploymentStatus from '../DeploymentStatus';

describe('DeploymentStatus', () => {
  it('renders "Pending" with pending class for pending status', () => {
    const { container } = render(<DeploymentStatus status="pending" />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(container.querySelector('.badge-pending')).toBeInTheDocument();
  });

  it('renders "Deploying" with in_progress class for in_progress status', () => {
    const { container } = render(<DeploymentStatus status="in_progress" />);
    expect(screen.getByText('Deploying')).toBeInTheDocument();
    expect(container.querySelector('.badge-in_progress')).toBeInTheDocument();
  });

  it('renders "Succeeded" with succeeded class for succeeded status', () => {
    const { container } = render(<DeploymentStatus status="succeeded" />);
    expect(screen.getByText('Succeeded')).toBeInTheDocument();
    expect(container.querySelector('.badge-succeeded')).toBeInTheDocument();
  });

  it('renders "Failed" with failed class for failed status', () => {
    const { container } = render(<DeploymentStatus status="failed" />);
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(container.querySelector('.badge-failed')).toBeInTheDocument();
  });

  it('has aria-label describing the status', () => {
    render(<DeploymentStatus status="succeeded" />);
    expect(screen.getByLabelText('Status: Succeeded')).toBeInTheDocument();
  });

  it('applies badge-lg class when large prop is true', () => {
    const { container } = render(<DeploymentStatus status="pending" large />);
    expect(container.querySelector('.badge-lg')).toBeInTheDocument();
  });

  it('applies badge-animated class for in_progress', () => {
    const { container } = render(<DeploymentStatus status="in_progress" />);
    expect(container.querySelector('.badge-animated')).toBeInTheDocument();
  });

  it('shows icon for each status', () => {
    const { container } = render(<DeploymentStatus status="succeeded" />);
    expect(container.textContent).toContain('✓');
  });
});
