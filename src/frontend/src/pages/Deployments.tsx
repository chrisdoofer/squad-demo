import { useEffect, useState } from 'react';
import { Deployment } from '../types';
import { getDeployments } from '../services/api';

function Deployments() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDeployments()
      .then(setDeployments)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading deployments...</p>;

  return (
    <div>
      <h2>Deployments</h2>
      {deployments.length === 0 ? (
        <p>No deployments yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Template</th>
              <th>Target</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {deployments.map((d) => (
              <tr key={d.id}>
                <td>{d.id}</td>
                <td>{d.templateId}</td>
                <td>{d.target}</td>
                <td>{d.status}</td>
                <td>{new Date(d.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Deployments;
