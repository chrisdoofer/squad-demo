export interface TemplateParameter {
  name: string;
  type: string;
  description: string;
  required?: boolean;
  default?: string | number | boolean;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  complexity: 'beginner' | 'intermediate' | 'advanced';
  sourceUrl: string;
  services: string[];
  bicepPath: string;
  workflowPath: string;
  parameters: TemplateParameter[];
}

export interface DeploymentRequest {
  templateId: string;
  target: 'azure' | 'github';
  parameters: Record<string, string | number | boolean>;
  azureConfig?: {
    subscriptionId: string;
    resourceGroup: string;
    location: string;
  };
  githubConfig?: {
    owner: string;
    repo: string;
    branch?: string;
  };
}

export interface Deployment {
  id: string;
  templateId: string;
  target: 'azure' | 'github';
  status: 'pending' | 'in_progress' | 'succeeded' | 'failed';
  createdAt: string;
  updatedAt: string;
  parameters: Record<string, string | number | boolean>;
  result?: Record<string, unknown>;
  error?: string;
}
