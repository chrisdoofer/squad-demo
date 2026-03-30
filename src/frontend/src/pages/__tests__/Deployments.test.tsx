import { act, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Deployments from '../Deployments';
import type { Deployment } from '../../types';

const mockDeployments: Deployment[] = [
  {
    id: 'dep-001-abcdef12',
    templateId: 'web-app',
    target: 'azure',
    status: 'succeeded',
    createdAt: '2024-06-15T10:30:00Z',
    updatedAt: '2024-06-15T10:35:00Z',
    parameters: { appName: 'myapp' },
  },
  {
    id: 'dep-002-ghijkl34',
    templateId: 'data-pipeline',
    target: 'github',
    status: 'pending',
    createdAt: '2024-06-15T11:00:00Z',
    updatedAt: '2024-06-15T11:00:00Z',
    parameters: {},
  },
  {
    id: 'dep-003-mnopqr56',
    templateId: 'ai-bot',
    target: 'azure',
    status: 'failed',
    createdAt: '2024-06-15T09:00:00Z',
    updatedAt: '2024-06-15T09:05:00Z',
    parameters: {},
    error: 'Quota exceeded',
  },
];

vi.mock('../../services/api', () => ({
  getDeployments: vi.fn(),
}));

import { getDeployments } from '../../services/api';
const mockedGetDeployments = vi.mocked(getDeployments);

function renderDeployments() {
  return render(
    <MemoryRouter>
      <Deployments />
    </MemoryRouter>,
  );
}

describe('Deployments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows loading state initially', () => {
    mockedGetDeployments.mockReturnValueOnce(new Promise(() => {}));
    renderDeployments();
    expect(screen.getByText('Loading deployments…')).toBeInTheDocument();
  });

  it('shows empty state when no deployments', async () => {
    mockedGetDeployments.mockResolvedValueOnce([]);
    renderDeployments();

    await waitFor(() => {
      expect(screen.getByText('No deployments yet')).toBeInTheDocument();
    });
    expect(screen.getByText('Browse Templates')).toBeInTheDocument();
  });

  it('renders deployment table with data', async () => {
    mockedGetDeployments.mockResolvedValueOnce(mockDeployments);
    renderDeployments();

    await waitFor(() => {
      expect(screen.getByText('dep-001-')).toBeInTheDocument();
    });
    expect(screen.getByText('web-app')).toBeInTheDocument();
    expect(screen.getByText('data-pipeline')).toBeInTheDocument();
  });

  it('shows correct status badges', async () => {
    mockedGetDeployments.mockResolvedValueOnce(mockDeployments);
    renderDeployments();

    await waitFor(() => {
      expect(screen.getByText('Succeeded')).toBeInTheDocument();
    });
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('shows error state when fetch fails', async () => {
    mockedGetDeployments.mockRejectedValueOnce(new Error('Server error'));
    renderDeployments();

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });

  it('auto-refreshes when active deployments exist', async () => {
    mockedGetDeployments.mockResolvedValueOnce(mockDeployments);
    renderDeployments();

    await waitFor(() => {
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    // Setup mock for the refresh call
    mockedGetDeployments.mockResolvedValueOnce(mockDeployments);

    // Advance timer past the poll interval (10s)
    await act(async () => {
      vi.advanceTimersByTime(10_000);
    });

    // Should have been called again for the refresh
    await waitFor(() => {
      expect(mockedGetDeployments).toHaveBeenCalledTimes(2);
    });
  });

  it('shows table headers', async () => {
    mockedGetDeployments.mockResolvedValueOnce(mockDeployments);
    renderDeployments();

    await waitFor(() => {
      expect(screen.getByText('ID')).toBeInTheDocument();
    });
    expect(screen.getByText('Template')).toBeInTheDocument();
    expect(screen.getByText('Target')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Created')).toBeInTheDocument();
  });
});
