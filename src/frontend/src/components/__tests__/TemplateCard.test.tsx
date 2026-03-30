import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import TemplateCard from '../TemplateCard';
import type { Template } from '../../types';

const mockTemplate: Template = {
  id: 'web-app-sql',
  name: 'Web App with SQL',
  description: 'A production-ready web app with Azure SQL backend',
  category: 'Web',
  complexity: 'intermediate',
  sourceUrl: 'https://learn.microsoft.com/example',
  services: ['App Service', 'SQL Database', 'Key Vault'],
  bicepPath: 'templates/bicep/web-app-sql/main.bicep',
  workflowPath: 'templates/workflows/web-app-sql/deploy.yml',
  parameters: [
    { name: 'appName', type: 'string', description: 'App name', required: true },
  ],
};

function renderCard(template = mockTemplate) {
  return render(
    <MemoryRouter>
      <TemplateCard template={template} />
    </MemoryRouter>,
  );
}

describe('TemplateCard', () => {
  it('renders template name and description', () => {
    renderCard();
    expect(screen.getByText('Web App with SQL')).toBeInTheDocument();
    expect(screen.getByText('A production-ready web app with Azure SQL backend')).toBeInTheDocument();
  });

  it('shows category badge with correct text', () => {
    renderCard();
    expect(screen.getByText('Web')).toBeInTheDocument();
  });

  it('shows complexity badge', () => {
    renderCard();
    expect(screen.getByText('intermediate')).toBeInTheDocument();
  });

  it('displays service count', () => {
    renderCard();
    expect(screen.getByText('3 Azure services')).toBeInTheDocument();
  });

  it('shows singular "service" when only one service', () => {
    const single = { ...mockTemplate, services: ['App Service'] };
    renderCard(single);
    expect(screen.getByText('1 Azure service')).toBeInTheDocument();
  });

  it('renders link to template detail page', () => {
    renderCard();
    const link = screen.getByRole('link', { name: /view details/i });
    expect(link).toHaveAttribute('href', '/templates/web-app-sql');
  });

  it('renders as an article element', () => {
    renderCard();
    expect(screen.getByRole('article')).toBeInTheDocument();
  });
});
