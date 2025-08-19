import React from 'react';

const CompilerOutput = ({ output, error, isLoading }) => {
  return (
    <div className="compiler-output">
      <h3>Compiler Output</h3>
      {isLoading ? (
        <div>Compiling...</div>
      ) : error ? (
        <pre style={{ color: 'red' }}>{error}</pre>
      ) : (
        <pre>{output}</pre>
      )}
    </div>
  );
};

export default CompilerOutput;
