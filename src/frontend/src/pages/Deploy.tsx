import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { DeploymentRequest } from '../types';
import { createDeployment } from '../services/api';

function Deploy() {
  const { templateId } = useParams<{ templateId: string }>();
  const [target, setTarget] = useState<'azure' | 'github'>('azure');
  const [status, setStatus] = useState<string>('');

  const handleDeploy = async () => {
    if (!templateId) return;

    const request: DeploymentRequest = {
      templateId,
      target,
      parameters: {},
    };

    try {
      setStatus('Deploying...');
      await createDeployment(request);
      setStatus('Deployment initiated successfully.');
    } catch {
      setStatus('Deployment failed. Please try again.');
    }
  };

  return (
    <div>
      <h2>Deploy Template: {templateId}</h2>
      <div>
        <label>
          Target:
          <select value={target} onChange={(e) => setTarget(e.target.value as 'azure' | 'github')}>
            <option value="azure">Azure Subscription</option>
            <option value="github">GitHub Repository</option>
          </select>
        </label>
      </div>
      <button onClick={handleDeploy}>Deploy</button>
      {status && <p>{status}</p>}
    </div>
  );
}

export default Deploy;
