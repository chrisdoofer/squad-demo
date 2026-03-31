import { Link } from 'react-router-dom';

const steps = [
  {
    icon: '📚',
    title: 'Browse Patterns',
    description:
      'Explore our curated catalog of production-ready Azure architecture patterns. Filter by category, complexity, or search for specific services.',
  },
  {
    icon: '🔍',
    title: 'Review Architecture',
    description:
      'Understand the components, services, and design decisions behind each pattern. Read the detailed descriptions and view architecture diagrams.',
  },
  {
    icon: '🚀',
    title: 'Deploy to Azure',
    description:
      'Click the "Deploy to Azure" button to launch the Bicep template directly in the Azure Portal. Fill in your parameters and deploy in minutes.',
  },
  {
    icon: '🛠️',
    title: 'Customize',
    description:
      'Clone the Bicep templates and GitHub Actions workflows. Modify them to match your specific requirements, naming conventions, and policies.',
  },
];

export function GettingStartedPage() {
  return (
    <div className="getting-started">
      <section className="hero">
        <h1 className="hero-title">Getting Started</h1>
        <p className="hero-subtitle">
          Go from zero to production on Azure in four simple steps
        </p>
      </section>

      <section className="steps">
        {steps.map((step, i) => (
          <div className="step-card" key={step.title}>
            <div className="step-number">{i + 1}</div>
            <div className="step-icon" aria-hidden="true">
              {step.icon}
            </div>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
          </div>
        ))}
      </section>

      <section className="prerequisites">
        <h2>Prerequisites</h2>
        <div className="prereq-grid">
          <div className="prereq-card">
            <span className="prereq-icon" aria-hidden="true">
              ☁️
            </span>
            <h3>Azure Subscription</h3>
            <p>
              You need an active Azure subscription.{' '}
              <a
                href="https://azure.microsoft.com/free/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Create a free account →
              </a>
            </p>
          </div>
          <div className="prereq-card">
            <span className="prereq-icon" aria-hidden="true">
              🐙
            </span>
            <h3>GitHub Account</h3>
            <p>
              A GitHub account is required for CI/CD workflows.{' '}
              <a
                href="https://github.com/join"
                target="_blank"
                rel="noopener noreferrer"
              >
                Sign up for GitHub →
              </a>
            </p>
          </div>
          <div className="prereq-card">
            <span className="prereq-icon" aria-hidden="true">
              💻
            </span>
            <h3>Azure CLI</h3>
            <p>
              Install the Azure CLI for local development and deployment.{' '}
              <a
                href="https://learn.microsoft.com/cli/azure/install-azure-cli"
                target="_blank"
                rel="noopener noreferrer"
              >
                Install Azure CLI →
              </a>
            </p>
          </div>
        </div>
      </section>

      <section className="contributing">
        <h2>Contributing New Patterns</h2>
        <p>
          We welcome contributions from the team! To add a new architecture
          pattern:
        </p>
        <ol>
          <li>
            Create a Bicep template in the <code>infra/</code> directory
          </li>
          <li>
            Add a GitHub Actions workflow for validation and deployment
          </li>
          <li>
            Update the pattern catalog data with your new entry
          </li>
          <li>Submit a pull request for review</li>
        </ol>
        <Link to="/" className="btn-primary" style={{ display: 'inline-block', marginTop: '1rem' }}>
          Browse the Catalog
        </Link>
      </section>
    </div>
  );
}
