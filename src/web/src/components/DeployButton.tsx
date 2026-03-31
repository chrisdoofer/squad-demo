interface DeployButtonProps {
  deployUrl: string;
  patternName: string;
  size?: 'small' | 'large';
}

export function DeployButton({
  deployUrl,
  patternName,
  size = 'small',
}: DeployButtonProps) {
  return (
    <a
      href={deployUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`deploy-btn deploy-btn-${size}`}
      title={`Deploy ${patternName} to your Azure subscription`}
    >
      <span aria-hidden="true">🚀</span> Deploy to Azure
    </a>
  );
}
