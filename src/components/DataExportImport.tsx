import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { useBacktest } from '../context/BacktestContext';

const Container = styled.div`
  background-color: #ffffff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
`;

const Title = styled.h2`
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
  font-size: 1.5rem;
`;

const SectionTitle = styled.h3`
  color: #333;
  margin-bottom: 10px;
  font-size: 1.2rem;
`;

const Description = styled.p`
  color: #555;
  margin-bottom: 15px;
  line-height: 1.5;

  strong {
    color: #dc3545;
  }
`;

const InfoText = styled.p`
  color: #666;
  margin-bottom: 15px;
  font-size: 0.95rem;
  line-height: 1.5;
`;

const StatusBadge = styled.span<{ success?: boolean }>`
  display: inline-block;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 0.85rem;
  font-weight: 500;
  margin-top: 10px;
  background-color: ${props => props.success ? '#d4edda' : '#f8d7da'};
  color: ${props => props.success ? '#155724' : '#721c24'};
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
`;

const Button = styled.button`
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 15px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #0069d9;
  }
`;

const ButtonSecondary = styled(Button)`
  background-color: #6c757d;

  &:hover {
    background-color: #5a6268;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 200px;
  padding: 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-family: monospace;
  margin-bottom: 15px;
  resize: vertical;
  color: #333;
  background-color: #fff;
  
  &:focus {
    border-color: #007bff;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
    outline: none;
  }
`;

const ImportContainer = styled.div`
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
`;

const SyncContainer = styled.div`
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
  margin-bottom: 20px;
`;

const DataExportImport: React.FC = () => {
  const { exportData, importData, syncWithRepo, state } = useBacktest();
  const [jsonData, setJsonData] = useState('');
  const [importText, setImportText] = useState('');
  const [syncStatus, setSyncStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [lastSyncCheck, setLastSyncCheck] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Check for repo updates when component mounts
  useEffect(() => {
    checkForUpdates();
  }, []);

  const checkForUpdates = async () => {
    try {
      setIsSyncing(true);
      const result = await syncWithRepo();
      setSyncStatus(result);
      setLastSyncCheck(new Date());
      setIsSyncing(false);
    } catch (error) {
      console.error("Error checking for updates", error);
      setSyncStatus({ success: false, message: "Error checking for updates" });
      setIsSyncing(false);
    }
  };

  const handleExport = () => {
    const data = exportData();
    setJsonData(data);
    
    // Create a download link
    const element = document.createElement('a');
    const file = new Blob([data], { type: 'application/json' });
    element.href = URL.createObjectURL(file);
    
    // Set the file name with current date
    const now = new Date();
    const dateString = now.toISOString().split('T')[0];
    element.download = `backtest-data-${dateString}.json`;
    
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleImport = () => {
    if (!importText.trim()) {
      alert('Please paste JSON data to import');
      return;
    }

    try {
      // Check if it's valid JSON
      JSON.parse(importText);
      
      if (window.confirm('Are you sure you want to import this data? This will override your current data.')) {
        importData(importText);
        setImportText('');
        alert('Data imported successfully!');
      }
    } catch (error) {
      alert('Invalid JSON format. Please check the data and try again.');
    }
  };

  const handleManualSync = async () => {
    try {
      setIsSyncing(true);
      const result = await syncWithRepo();
      setSyncStatus(result);
      setLastSyncCheck(new Date());
      
      if (result.success) {
        alert('Successfully synchronized with repository data!');
      } else {
        alert(`Sync status: ${result.message}`);
      }
      setIsSyncing(false);
    } catch (error) {
      console.error("Error during manual sync:", error);
      setSyncStatus({ success: false, message: "Error during sync" });
      alert('Error during synchronization. Please try again.');
      setIsSyncing(false);
    }
  };

  return (
    <Container>
      <Title>Data Management</Title>
      
      <SyncContainer>
        <SectionTitle>Repository Sync</SectionTitle>
        <Description>
          Automatically sync with the shared repository data file. This allows you to share
          your backtest data with other users.
        </Description>
        <InfoText>
          Last check: {lastSyncCheck ? lastSyncCheck.toLocaleString() : 'Never'}<br/>
          Last updated: {state.lastUpdated ? new Date(parseInt(state.lastUpdated)).toLocaleString() : 'Never'}<br/>
          {syncStatus && (
            <StatusBadge success={syncStatus.success}>
              {syncStatus.message}
            </StatusBadge>
          )}
        </InfoText>
        <ButtonContainer>
          <Button onClick={handleManualSync} disabled={isSyncing}>
            {isSyncing ? 'Syncing...' : 'Sync with Repository'}
          </Button>
        </ButtonContainer>
      </SyncContainer>
      
      <div>
        <SectionTitle>Export Data</SectionTitle>
        <Description>
          Export your backtest data to a JSON file. You can later use this file to restore 
          your data or share it with others.
        </Description>
        <ButtonContainer>
          <Button onClick={handleExport}>Export Data</Button>
          {jsonData && (
            <ButtonSecondary onClick={() => setJsonData('')}>
              Clear
            </ButtonSecondary>
          )}
        </ButtonContainer>
        
        {jsonData && (
          <TextArea value={jsonData} readOnly />
        )}
      </div>
      
      <ImportContainer>
        <SectionTitle>Import Data</SectionTitle>
        <Description>
          Import previously exported backtest data. 
          <strong> Warning: This will override your current data.</strong>
        </Description>
        <TextArea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder="Paste JSON data here"
        />
        <ButtonContainer>
          <Button onClick={handleImport}>Import Data</Button>
          {importText && (
            <ButtonSecondary onClick={() => setImportText('')}>
              Clear
            </ButtonSecondary>
          )}
        </ButtonContainer>
      </ImportContainer>
    </Container>
  );
};

export default DataExportImport; 