import React from 'react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ 
  icon = '📭', 
  title, 
  description, 
  action 
}: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      textAlign: 'center',
      color: '#6b7280'
    }}>
      <div style={{
        fontSize: '64px',
        marginBottom: '16px'
      }}>
        {icon}
      </div>
      <h3 style={{
        margin: '0 0 8px 0',
        fontSize: '20px',
        fontWeight: 600,
        color: '#1f2937',
        fontFamily: "'Inter', sans-serif"
      }}>
        {title}
      </h3>
      {description && (
        <p style={{
          margin: '0 0 24px 0',
          fontSize: '14px',
          color: '#6b7280',
          maxWidth: '400px',
          fontFamily: "'Inter', sans-serif"
        }}>
          {description}
        </p>
      )}
      {action && (
        <div>
          {action}
        </div>
      )}
    </div>
  );
}

