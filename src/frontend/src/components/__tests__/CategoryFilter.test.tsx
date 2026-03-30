import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import CategoryFilter from '../CategoryFilter';

const categories = ['all', 'Web', 'Data', 'AI'];

function renderFilter(overrides: Partial<Parameters<typeof CategoryFilter>[0]> = {}) {
  const props = {
    categories,
    selected: 'all',
    onSelect: vi.fn(),
    search: '',
    onSearchChange: vi.fn(),
    ...overrides,
  };
  const result = render(<CategoryFilter {...props} />);
  return { ...result, props };
}

describe('CategoryFilter', () => {
  it('renders all category options', () => {
    renderFilter();
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Web')).toBeInTheDocument();
    expect(screen.getByText('Data')).toBeInTheDocument();
    expect(screen.getByText('AI')).toBeInTheDocument();
  });

  it('highlights active category with aria-pressed', () => {
    renderFilter({ selected: 'Web' });
    const webChip = screen.getByRole('button', { name: 'Web' });
    expect(webChip).toHaveAttribute('aria-pressed', 'true');

    const allChip = screen.getByRole('button', { name: 'All' });
    expect(allChip).toHaveAttribute('aria-pressed', 'false');
  });

  it('applies chip-active class to selected category', () => {
    renderFilter({ selected: 'Data' });
    const dataChip = screen.getByRole('button', { name: 'Data' });
    expect(dataChip).toHaveClass('chip-active');
  });

  it('calls onSelect when chip clicked', async () => {
    const user = userEvent.setup();
    const { props } = renderFilter();

    await user.click(screen.getByRole('button', { name: 'Web' }));
    expect(props.onSelect).toHaveBeenCalledWith('Web');
  });

  it('renders search input with correct placeholder', () => {
    renderFilter();
    expect(screen.getByPlaceholderText('Search templates…')).toBeInTheDocument();
  });

  it('search input has the provided value', () => {
    renderFilter({ search: 'serverless' });
    const input = screen.getByLabelText('Search templates');
    expect(input).toHaveValue('serverless');
  });

  it('calls onSearchChange when typing in search', async () => {
    const user = userEvent.setup();
    const { props } = renderFilter();

    const input = screen.getByLabelText('Search templates');
    await user.type(input, 'api');
    expect(props.onSearchChange).toHaveBeenCalled();
    // Each keystroke triggers a call
    expect(props.onSearchChange).toHaveBeenCalledWith('a');
  });
});
