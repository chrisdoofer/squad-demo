import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TemplateDetail from '../TemplateDetail';
import type { Template } from '../../types';

const mockTemplate: Template = {
  id: 'web-app-sql',
  name: 'Web App with SQL',
  description: 'Full-stack web app with Azure SQL',
  category: 'Web',
  complexity: 'intermediate',
  sourceUrl: 'https://learn.microsoft.com/example',
  services: ['App Service', 'SQL Database', 'Key Vault'],
  bicepPath: 'templates/bicep/web-app-sql/main.bicep',
  workflowPath: 'templates/workflows/web-app-sql/deploy.yml',
  parameters: [
    { name: 'appName', type: 'string', description: 'Application name', required: true },
    { name: 'sku', type: 'string', description: 'App Service SKU', required: false, default: 'B1' },
  ],
};

vi.mock('../../services/api', () => ({
  getTemplate: vi.fn(),
  getTemplateBicep: vi.fn(),
  getTemplateWorkflow: vi.fn(),
}));

import { getTemplate, getTemplateBicep, getTemplateWorkflow } from '../../services/api';
const mockedGetTemplate = vi.mocked(getTemplate);
const mockedGetTemplateBicep = vi.mocked(getTemplateBicep);
const mockedGetTemplateWorkflow = vi.mocked(getTemplateWorkflow);

function renderDetail(id = 'web-app-sql') {
  return render(
    <MemoryRouter initialEntries={[`/templates/${id}`]}>
      <Routes>
        <Route path="/templates/:id" element={<TemplateDetail />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('TemplateDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    mockedGetTemplate.mockReturnValueOnce(new Promise(() => {}));
    renderDetail();
    expect(screen.getByText('Loading template…')).toBeInTheDocument();
  });

  it('shows template name and description after loading', async () => {
    mockedGetTemplate.mockResolvedValueOnce(mockTemplate);
    renderDetail();

    await waitFor(() => {
      expect(screen.getByText('Web App with SQL')).toBeInTheDocument();
    });
    expect(screen.getByText('Full-stack web app with Azure SQL')).toBeInTheDocument();
  });

  it('renders tabs (Overview, Bicep Template, Workflow)', async () => {
    mockedGetTemplate.mockResolvedValueOnce(mockTemplate);
    renderDetail();

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Overview' })).toBeInTheDocument();
    });
    expect(screen.getByRole('tab', { name: 'Bicep Template' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Workflow' })).toBeInTheDocument();
  });

  it('overview tab shows parameter table', async () => {
    mockedGetTemplate.mockResolvedValueOnce(mockTemplate);
    renderDetail();

    await waitFor(() => {
      expect(screen.getByText('appName')).toBeInTheDocument();
    });
    expect(screen.getByText('sku')).toBeInTheDocument();
    expect(screen.getByText('Application name')).toBeInTheDocument();
  });

  it('has Deploy to Azure link', async () => {
    mockedGetTemplate.mockResolvedValueOnce(mockTemplate);
    renderDetail();

    await waitFor(() => {
      expect(screen.getByText('Deploy to Azure')).toBeInTheDocument();
    });
    const link = screen.getByText('Deploy to Azure').closest('a');
    expect(link).toHaveAttribute('href', '/deploy/web-app-sql?target=azure');
  });

  it('has Push to GitHub link', async () => {
    mockedGetTemplate.mockResolvedValueOnce(mockTemplate);
    renderDetail();

    await waitFor(() => {
      expect(screen.getByText('Push to GitHub')).toBeInTheDocument();
    });
    const link = screen.getByText('Push to GitHub').closest('a');
    expect(link).toHaveAttribute('href', '/deploy/web-app-sql?target=github');
  });

  it('switches to Bicep tab and loads content', async () => {
    const user = userEvent.setup();
    mockedGetTemplate.mockResolvedValueOnce(mockTemplate);
    mockedGetTemplateBicep.mockResolvedValueOnce('resource appPlan {}');
    renderDetail();

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Bicep Template' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('tab', { name: 'Bicep Template' }));

    await waitFor(() => {
      expect(screen.getByText('resource appPlan {}')).toBeInTheDocument();
    });
    expect(mockedGetTemplateBicep).toHaveBeenCalledWith('web-app-sql');
  });

  it('switches to Workflow tab and loads content', async () => {
    const user = userEvent.setup();
    mockedGetTemplate.mockResolvedValueOnce(mockTemplate);
    mockedGetTemplateWorkflow.mockResolvedValueOnce('name: deploy');
    renderDetail();

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Workflow' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('tab', { name: 'Workflow' }));

    await waitFor(() => {
      expect(screen.getByText('name: deploy')).toBeInTheDocument();
    });
    expect(mockedGetTemplateWorkflow).toHaveBeenCalledWith('web-app-sql');
  });

  it('shows error state when fetch fails', async () => {
    mockedGetTemplate.mockRejectedValueOnce(new Error('Not found'));
    renderDetail();

    await waitFor(() => {
      expect(screen.getByText('Not found')).toBeInTheDocument();
    });
  });

  it('displays Azure services section', async () => {
    mockedGetTemplate.mockResolvedValueOnce(mockTemplate);
    renderDetail();

    await waitFor(() => {
      expect(screen.getByText('App Service')).toBeInTheDocument();
    });
    expect(screen.getByText('SQL Database')).toBeInTheDocument();
    expect(screen.getByText('Key Vault')).toBeInTheDocument();
  });
});
