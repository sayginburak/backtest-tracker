import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { useBacktest } from '../context/BacktestContext';
import { Analysis } from '../types';

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
  const { exportData, exportToCsv, importData, syncWithRepo, state } = useBacktest();
  const [jsonData, setJsonData] = useState('');
  const [importText, setImportText] = useState('');
  const [syncStatus, setSyncStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [lastSyncCheck, setLastSyncCheck] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [csvType, setCsvType] = useState<'backtests' | 'analyses' | 'all'>('all');

  // Check for repo updates when component mounts, but don't auto-fetch
  useEffect(() => {
    // Only check when the sync status hasn't been set yet
    if (!syncStatus) {
      const lastSync = localStorage.getItem('backtest_last_sync_time');
      const lastSyncDate = lastSync ? new Date(parseInt(lastSync)) : null;
      
      if (lastSyncDate) {
        setLastSyncCheck(lastSyncDate);
        
        // If we synced recently (within 24 hours), don't check again automatically
        const hoursSinceLastSync = (Date.now() - lastSyncDate.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceLastSync < 24) {
          setSyncStatus({ 
            success: true, 
            message: `Last synced ${Math.round(hoursSinceLastSync)} hours ago` 
          });
          return;
        }
      }
      
      // Don't automatically sync - just show a message that it's available
      setSyncStatus({ 
        success: true, 
        message: "Click 'Sync with Repository' to check for updates" 
      });
    }
  }, [syncStatus]);

  const checkForUpdates = async (force: boolean = false) => {
    try {
      setIsSyncing(true);
      setSyncStatus({ success: true, message: "Syncing in progress..." });
      
      const result = await syncWithRepo(force);
      setSyncStatus(result);
      setLastSyncCheck(new Date());
      
      // Update localStorage to mark the last sync time
      localStorage.setItem('backtest_last_sync_time', Date.now().toString());
      
      setIsSyncing(false);
      return result;
    } catch (error) {
      console.error("Error checking for updates", error);
      setSyncStatus({ success: false, message: `Error: ${error}` });
      setIsSyncing(false);
      throw error;
    }
  };

  const handleExport = () => {
    const data = exportData();
    const fullData = JSON.stringify({ ...JSON.parse(data), analyses: state.analyses });
    setJsonData(fullData);
    
    // Create a download link
    const element = document.createElement('a');
    const file = new Blob([fullData], { type: 'application/json' });
    element.href = URL.createObjectURL(file);
    
    // Set the file name with current date
    const now = new Date();
    const dateString = now.toISOString().split('T')[0];
    element.download = `backtest-data-${dateString}.json`;
    
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleExportCsv = () => {
    const csvData = exportToCsv();
    
    // Create a download link
    const element = document.createElement('a');
    const file = new Blob([csvData], { type: 'text/csv' });
    element.href = URL.createObjectURL(file);
    
    // Set the file name with current date
    const now = new Date();
    const dateString = now.toISOString().split('T')[0];
    element.download = `backtest-data-${dateString}.csv`;
    
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };
  
  // Export analyses as CSV
  const exportAnalysesToCsv = (): string => {
    // CSV header
    let csv = 'ID,Backtest Date,Date Performed,Result Type,Notion URL\n';
    
    // Get all analyses
    const allAnalyses: Analysis[] = [];
    Object.keys(state.analyses).forEach(date => {
      state.analyses[date].forEach(analysis => {
        allAnalyses.push(analysis);
      });
    });
    
    // Sort by date performed (newest first)
    allAnalyses.sort((a, b) => {
      return new Date(b.datePerformed).getTime() - new Date(a.datePerformed).getTime();
    });
    
    // Add each analysis as a row
    allAnalyses.forEach(analysis => {
      csv += `"${analysis.id}","${analysis.backtestDate}","${analysis.datePerformed}","${analysis.resultType}","${analysis.notionUrl}"\n`;
    });
    
    return csv;
  };
  
  const handleExportAnalysesCsv = () => {
    const csvData = exportAnalysesToCsv();
    
    // Create a download link
    const element = document.createElement('a');
    const file = new Blob([csvData], { type: 'text/csv' });
    element.href = URL.createObjectURL(file);
    
    // Set the file name with current date
    const now = new Date();
    const dateString = now.toISOString().split('T')[0];
    element.download = `analysis-data-${dateString}.csv`;
    
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
      const parsedData = JSON.parse(importText);
      
      if (window.confirm('Are you sure you want to import this data? This will override your current data.')) {
        importData(JSON.stringify({ ...parsedData, analyses: parsedData.analyses || {} }));
        setImportText('');
        alert('Data imported successfully!');
      }
    } catch (error) {
      alert('Invalid JSON format. Please check the data and try again.');
    }
  };

  const handleManualSync = async () => {
    try {
      // Force sync with true parameter
      const result = await checkForUpdates(true);
      
      if (result.success) {
        if (result.message.includes("up to date")) {
          alert('Your data is already up to date with the repository.');
        } else {
          alert('Successfully synchronized with repository data!');
        }
      } else {
        alert(`Sync failed: ${result.message}`);
      }
    } catch (error) {
      console.error("Error during manual sync:", error);
      alert('Error during synchronization. Please try again.');
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
          Export your backtest and analysis data as a JSON or CSV file. You can use JSON files to restore 
          your data later, while CSV files are better for analyzing data in spreadsheets.
        </Description>
        <ButtonContainer>
          <Button onClick={handleExport}>Export All as JSON</Button>
          <Button onClick={handleExportCsv}>Export Backtests as CSV</Button>
          <Button onClick={handleExportAnalysesCsv}>Export Analyses as CSV</Button>
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
          Import previously exported backtest and analysis data. 
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