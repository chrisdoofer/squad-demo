import type { TemplateParameter } from '../types';

interface ParameterFormProps {
  parameters: TemplateParameter[];
  values: Record<string, string | number | boolean>;
  onChange: (name: string, value: string | number | boolean) => void;
  disabled?: boolean;
}

function ParameterForm({ parameters, values, onChange, disabled }: ParameterFormProps) {
  const renderField = (param: TemplateParameter) => {
    const value = values[param.name] ?? param.default ?? '';

    if (param.type === 'bool') {
      return (
        <div className="form-group" key={param.name}>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => onChange(param.name, e.target.checked)}
              disabled={disabled}
            />
            <span>
              {param.name}
              {param.required && <span className="required-mark"> *</span>}
            </span>
          </label>
          <p className="hint">{param.description}</p>
        </div>
      );
    }

    if (param.type === 'int') {
      return (
        <div className="form-group" key={param.name}>
          <label htmlFor={`param-${param.name}`}>
            {param.name}
            {param.required && <span className="required-mark"> *</span>}
          </label>
          <input
            id={`param-${param.name}`}
            type="number"
            value={typeof value === 'number' ? value : 0}
            onChange={(e) => onChange(param.name, parseInt(e.target.value, 10) || 0)}
            disabled={disabled}
            required={param.required}
          />
          <p className="hint">{param.description}</p>
        </div>
      );
    }

    if (param.type === 'secureString') {
      return (
        <div className="form-group" key={param.name}>
          <label htmlFor={`param-${param.name}`}>
            {param.name}
            {param.required && <span className="required-mark"> *</span>}
          </label>
          <input
            id={`param-${param.name}`}
            type="password"
            value={String(value)}
            onChange={(e) => onChange(param.name, e.target.value)}
            disabled={disabled}
            required={param.required}
            placeholder="Enter secure value"
          />
          <p className="hint">{param.description}</p>
        </div>
      );
    }

    // Default: string type
    return (
      <div className="form-group" key={param.name}>
        <label htmlFor={`param-${param.name}`}>
          {param.name}
          {param.required && <span className="required-mark"> *</span>}
        </label>
        <input
          id={`param-${param.name}`}
          type="text"
          value={String(value)}
          onChange={(e) => onChange(param.name, e.target.value)}
          disabled={disabled}
          required={param.required}
        />
        <p className="hint">{param.description}</p>
      </div>
    );
  };

  if (parameters.length === 0) {
    return (
      <p style={{ color: 'var(--color-gray-500)', fontSize: '0.875rem' }}>
        No configurable parameters for this template.
      </p>
    );
  }

  return <div className="parameter-form">{parameters.map(renderField)}</div>;
}

export default ParameterForm;
