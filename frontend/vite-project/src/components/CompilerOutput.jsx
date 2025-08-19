import React from 'react';

const CompilerOutput = ({ output, error, isLoading }) => {
  return (
    <div className="compiler-output" style={{
      background: '#000',
      color: '#cccccc',
      fontFamily: 'Consolas, Menlo, Monaco, "Courier New", monospace',
      borderRadius: '4px',
      border: '1px solid #222',
      padding: '12px',
      marginTop: '12px',
      minHeight: '120px',
      maxHeight: '300px',
      overflowY: 'auto',
      fontSize: '14px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.10)'
    }}>
      {isLoading ? (
        <div style={{ color: '#569cd6' }}>Compiling...</div>
      ) : error ? (
        <pre style={{ color: '#f44747', whiteSpace: 'pre-wrap', margin: 0 }}>{error}</pre>
      ) : (
        <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{output}</pre>
      )}
    </div>
  );
};

export default CompilerOutput;
