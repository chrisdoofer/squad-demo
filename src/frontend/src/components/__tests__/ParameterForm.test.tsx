import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import ParameterForm from '../ParameterForm';
import type { TemplateParameter } from '../../types';

const stringParam: TemplateParameter = {
  name: 'appName',
  type: 'string',
  description: 'Name of the application',
  required: true,
  default: 'my-app',
};

const intParam: TemplateParameter = {
  name: 'instanceCount',
  type: 'int',
  description: 'Number of instances',
  required: false,
  default: 2,
};

const boolParam: TemplateParameter = {
  name: 'enableLogging',
  type: 'bool',
  description: 'Enable application logging',
  required: false,
  default: true,
};

const secureParam: TemplateParameter = {
  name: 'dbPassword',
  type: 'secureString',
  description: 'Database password',
  required: true,
};

const allParams = [stringParam, intParam, boolParam, secureParam];

function renderForm(
  params = allParams,
  values: Record<string, string | number | boolean> = {},
  onChange = vi.fn(),
) {
  return { ...render(
    <ParameterForm parameters={params} values={values} onChange={onChange} />,
  ), onChange };
}

describe('ParameterForm', () => {
  it('renders text input for string parameters', () => {
    renderForm([stringParam]);
    const input = screen.getByLabelText(/appName/);
    expect(input).toHaveAttribute('type', 'text');
  });

  it('renders number input for int parameters', () => {
    renderForm([intParam]);
    const input = screen.getByLabelText(/instanceCount/);
    expect(input).toHaveAttribute('type', 'number');
  });

  it('renders checkbox for bool parameters', () => {
    renderForm([boolParam]);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
  });

  it('renders password input for secureString parameters', () => {
    renderForm([secureParam]);
    const input = screen.getByLabelText(/dbPassword/);
    expect(input).toHaveAttribute('type', 'password');
  });

  it('shows required indicator for required params', () => {
    renderForm();
    const requiredMarks = screen.getAllByText('*');
    // appName and dbPassword are required
    expect(requiredMarks.length).toBeGreaterThanOrEqual(2);
  });

  it('pre-fills default values', () => {
    renderForm([stringParam], {});
    const input = screen.getByLabelText(/appName/) as HTMLInputElement;
    // Default value from param.default when no values provided
    expect(input.value).toBe('my-app');
  });

  it('uses provided values over defaults', () => {
    renderForm([stringParam], { appName: 'custom-name' });
    const input = screen.getByLabelText(/appName/) as HTMLInputElement;
    expect(input.value).toBe('custom-name');
  });

  it('calls onChange when text input value changes', async () => {
    const user = userEvent.setup();
    const { onChange } = renderForm([stringParam], { appName: '' });

    const input = screen.getByLabelText(/appName/);
    await user.type(input, 'x');
    expect(onChange).toHaveBeenCalledWith('appName', 'x');
  });

  it('calls onChange with number for int input', async () => {
    const user = userEvent.setup();
    const { onChange } = renderForm([intParam], { instanceCount: 2 });

    const input = screen.getByLabelText(/instanceCount/);
    await user.type(input, '5');
    // Since this is a controlled component and the mock doesn't update state,
    // the existing value (2) gets '5' appended → 25
    expect(onChange).toHaveBeenCalledWith('instanceCount', 25);
  });

  it('calls onChange with boolean for checkbox', async () => {
    const user = userEvent.setup();
    const { onChange } = renderForm([boolParam], { enableLogging: true });

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);
    expect(onChange).toHaveBeenCalledWith('enableLogging', false);
  });

  it('shows message when no parameters', () => {
    renderForm([]);
    expect(screen.getByText(/no configurable parameters/i)).toBeInTheDocument();
  });

  it('shows description hints for each parameter', () => {
    renderForm([stringParam]);
    expect(screen.getByText('Name of the application')).toBeInTheDocument();
  });

  it('disables inputs when disabled prop is true', () => {
    render(
      <ParameterForm
        parameters={[stringParam]}
        values={{}}
        onChange={vi.fn()}
        disabled
      />,
    );
    const input = screen.getByLabelText(/appName/);
    expect(input).toBeDisabled();
  });
});
