import React, { useState } from 'react';
import styled from '@emotion/styled';
import { useBacktest } from '../context/BacktestContext';
import AnalysisForm from './AnalysisForm';
import { Analysis } from '../types';

const PageContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
`;

const SuccessMessage = styled.div`
  background-color: #d4edda;
  color: #155724;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #155724;
`;

const AddAnalysisPage: React.FC = () => {
  const { addAnalysis } = useBacktest();
  const [showSuccess, setShowSuccess] = useState(false);
  
  const handleSubmit = (analysisData: Omit<Analysis, 'id'>) => {
    addAnalysis(analysisData);
    setShowSuccess(true);
    
    // Auto-hide success message after 5 seconds
    setTimeout(() => {
      setShowSuccess(false);
    }, 5000);
  };
  
  const handleCloseSuccess = () => {
    setShowSuccess(false);
  };
  
  return (
    <PageContainer>
      {showSuccess && (
        <SuccessMessage>
          <span>Analysis added successfully!</span>
          <CloseButton onClick={handleCloseSuccess}>&times;</CloseButton>
        </SuccessMessage>
      )}
      
      <AnalysisForm onSubmit={handleSubmit} />
    </PageContainer>
  );
};

export default AddAnalysisPage;