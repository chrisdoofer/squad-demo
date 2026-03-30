import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Home from '../Home';
import type { Template } from '../../types';

const mockTemplates: Template[] = [
  {
    id: 'web-app',
    name: 'Basic Web App',
    description: 'Simple web application on Azure',
    category: 'Web',
    complexity: 'beginner',
    sourceUrl: 'https://learn.microsoft.com/web',
    services: ['App Service'],
    bicepPath: 'templates/bicep/web/main.bicep',
    workflowPath: 'templates/workflows/web/deploy.yml',
    parameters: [],
  },
  {
    id: 'data-pipeline',
    name: 'Data Pipeline',
    description: 'ETL pipeline with Data Factory',
    category: 'Data',
    complexity: 'advanced',
    sourceUrl: 'https://learn.microsoft.com/data',
    services: ['Data Factory', 'Storage Account'],
    bicepPath: 'templates/bicep/data/main.bicep',
    workflowPath: 'templates/workflows/data/deploy.yml',
    parameters: [],
  },
  {
    id: 'ai-bot',
    name: 'AI Chat Bot',
    description: 'Intelligent chatbot with OpenAI',
    category: 'AI',
    complexity: 'intermediate',
    sourceUrl: 'https://learn.microsoft.com/ai',
    services: ['OpenAI', 'Bot Service'],
    bicepPath: 'templates/bicep/ai/main.bicep',
    workflowPath: 'templates/workflows/ai/deploy.yml',
    parameters: [],
  },
];

vi.mock('../../services/api', () => ({
  getTemplates: vi.fn(),
}));

import { getTemplates } from '../../services/api';
const mockedGetTemplates = vi.mocked(getTemplates);

function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>,
  );
}

describe('Home', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders hero section with title', async () => {
    mockedGetTemplates.mockResolvedValueOnce(mockTemplates);
    renderHome();
    expect(screen.getByText('Internal Developer Platform')).toBeInTheDocument();
  });

  it('shows loading state while fetching templates', () => {
    // Never resolve - stays loading
    mockedGetTemplates.mockReturnValueOnce(new Promise(() => {}));
    renderHome();
    expect(screen.getByText('Loading templates…')).toBeInTheDocument();
  });

  it('renders template cards after loading', async () => {
    mockedGetTemplates.mockResolvedValueOnce(mockTemplates);
    renderHome();

    await waitFor(() => {
      expect(screen.getByText('Basic Web App')).toBeInTheDocument();
    });
    expect(screen.getByText('Data Pipeline')).toBeInTheDocument();
    expect(screen.getByText('AI Chat Bot')).toBeInTheDocument();
  });

  it('filters templates by category when filter clicked', async () => {
    const user = userEvent.setup();
    mockedGetTemplates.mockResolvedValueOnce(mockTemplates);
    renderHome();

    await waitFor(() => {
      expect(screen.getByText('Basic Web App')).toBeInTheDocument();
    });

    // Click the "Web" category chip
    await user.click(screen.getByRole('button', { name: 'Web' }));

    expect(screen.getByText('Basic Web App')).toBeInTheDocument();
    expect(screen.queryByText('Data Pipeline')).not.toBeInTheDocument();
    expect(screen.queryByText('AI Chat Bot')).not.toBeInTheDocument();
  });

  it('filters templates by search query', async () => {
    const user = userEvent.setup();
    mockedGetTemplates.mockResolvedValueOnce(mockTemplates);
    renderHome();

    await waitFor(() => {
      expect(screen.getByText('Basic Web App')).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText('Search templates');
    await user.type(searchInput, 'chatbot');

    expect(screen.queryByText('Basic Web App')).not.toBeInTheDocument();
    expect(screen.queryByText('Data Pipeline')).not.toBeInTheDocument();
    expect(screen.getByText('AI Chat Bot')).toBeInTheDocument();
  });

  it('shows error state when fetch fails', async () => {
    mockedGetTemplates.mockRejectedValueOnce(new Error('Network error'));
    renderHome();

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('shows empty state when no templates match filter', async () => {
    const user = userEvent.setup();
    mockedGetTemplates.mockResolvedValueOnce(mockTemplates);
    renderHome();

    await waitFor(() => {
      expect(screen.getByText('Basic Web App')).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText('Search templates');
    await user.type(searchInput, 'xyznonexistent');

    expect(screen.getByText('No templates found')).toBeInTheDocument();
  });
});
