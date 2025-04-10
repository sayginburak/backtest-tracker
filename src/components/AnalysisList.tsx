import React, { useEffect } from 'react';
import styled from '@emotion/styled';
import { format, parseISO } from 'date-fns';
import { useBacktest } from '../context/BacktestContext';
import { useFilter } from '../App';
import { Analysis } from '../types';

const ListContainer = styled.div`
  background-color: #ffffff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
`;

const ListTitle = styled.h2`
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
  font-size: 1.5rem;
`;

const AnalysisTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
  font-size: 0.9rem;
  overflow-x: auto;
`;

const TableContainer = styled.div`
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
`;

const TableHead = styled.thead`
  background-color: #f2f2f2;
`;

const TableRow = styled.tr`
  &:nth-of-type(even) {
    background-color: #f8f9fa;
  }

  &:hover {
    background-color: #e9ecef;
  }
`;

const TableHeader = styled.th`
  padding: 12px 15px;
  text-align: left;
  border-bottom: 2px solid #dee2e6;
  color: #333;
  font-weight: 600;
  white-space: nowrap;
`;

const TableCell = styled.td`
  padding: 12px 15px;
  border-bottom: 1px solid #dee2e6;
  color: #333;
`;

const ActionButton = styled.button`
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 5px 10px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: background-color 0.2s;
  margin-right: 5px;

  &:hover {
    background-color: #c82333;
  }
`;

const ActionsContainer = styled.div`
  display: flex;
  gap: 5px;
`;

const EmptyState = styled.div`
  padding: 20px;
  text-align: center;
  color: #6c757d;
`;

const FilterContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
  
  @media (max-width: 576px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const FilterInput = styled.input`
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.9rem;
  width: 200px;
  color: #333;
  background-color: #fff;
  
  &:focus {
    border-color: #007bff;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
    outline: none;
  }
  
  @media (max-width: 576px) {
    width: 100%;
  }
`;

const ClearFilterButton = styled.button`
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;

  &:hover {
    background-color: #5a6268;
  }
`;

const NotionLink = styled.a`
  color: #007bff;
  text-decoration: none;
  font-weight: 500;
  
  &:hover {
    text-decoration: underline;
    color: #0056b3;
  }
`;

const ResultTypeLabel = styled.span<{ type: string }>`
  display: inline-block;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
  background-color: ${props => {
    switch (props.type) {
      case 'a': return '#4caf50'; // Green
      case 'b': return '#2196f3'; // Blue
      case 'c': return '#ff9800'; // Orange
      case 'd': return '#f44336'; // Red
      case 'e': return '#9c27b0'; // Purple
      default: return '#757575'; // Grey
    }
  }};
  color: white;
`;

const AnalysisList: React.FC = () => {
  const { state, deleteAnalysis } = useBacktest();
  const { filterDate, setFilterDate } = useFilter();
  const [searchDate, setSearchDate] = React.useState('');
  const isProduction = import.meta.env.PROD;

  useEffect(() => {
    if (filterDate) {
      setSearchDate(filterDate);
      
      const listElement = document.getElementById('analysis-list');
      if (listElement) {
        listElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [filterDate]);

  useEffect(() => {
    if (searchDate !== filterDate) {
      setFilterDate(searchDate);
    }
  }, [searchDate, setFilterDate]);

  // Get all analyses from all dates
  const getAllAnalyses = (): Analysis[] => {
    const allAnalyses: Analysis[] = [];
    
    Object.keys(state.analyses).forEach(date => {
      state.analyses[date].forEach(analysis => {
        allAnalyses.push(analysis);
      });
    });
    
    return allAnalyses;
  };

  // Filter analyses by date
  const getFilteredAnalyses = (): Analysis[] => {
    if (!searchDate) {
      return getAllAnalyses();
    }
    
    return state.analyses[searchDate] || [];
  };

  const handleClearFilter = () => {
    setSearchDate('');
    setFilterDate('');
  };

  const handleDeleteAnalysis = (id: string) => {
    if (window.confirm('Are you sure you want to delete this analysis?')) {
      deleteAnalysis(id);
    }
  };

  const renderResultTypeLabel = (type: string) => {
    return <ResultTypeLabel type={type}>{type.toUpperCase()}</ResultTypeLabel>;
  };

  const filteredAnalyses = getFilteredAnalyses();
  const hasAnalyses = filteredAnalyses.length > 0;

  return (
    <ListContainer id="analysis-list">
      <ListTitle>Analysis List</ListTitle>
      
      <FilterContainer>
        <FilterInput
          type="date"
          value={searchDate}
          onChange={(e) => setSearchDate(e.target.value)}
          placeholder="Filter by date"
        />
        {searchDate && (
          <ClearFilterButton onClick={handleClearFilter}>
            Clear Filter
          </ClearFilterButton>
        )}
      </FilterContainer>
      
      {hasAnalyses ? (
        <TableContainer>
          <AnalysisTable>
            <TableHead>
              <TableRow>
                <TableHeader>Backtest Date</TableHeader>
                <TableHeader>Date Performed</TableHeader>
                <TableHeader>Result Type</TableHeader>
                <TableHeader>Notion Document</TableHeader>
                {!isProduction && <TableHeader>Actions</TableHeader>}
              </TableRow>
            </TableHead>
            <tbody>
              {filteredAnalyses.map(analysis => (
                <TableRow key={analysis.id}>
                  <TableCell>{format(parseISO(analysis.backtestDate), 'MMM d, yyyy')}</TableCell>
                  <TableCell>{format(parseISO(analysis.datePerformed), 'MMM d, yyyy')}</TableCell>
                  <TableCell>{renderResultTypeLabel(analysis.resultType)}</TableCell>
                  <TableCell>
                    <NotionLink href={analysis.notionUrl} target="_blank" rel="noopener noreferrer">
                      View Document
                    </NotionLink>
                  </TableCell>
                  {!isProduction && (
                    <TableCell>
                      <ActionsContainer>
                        <ActionButton onClick={() => handleDeleteAnalysis(analysis.id)}>
                          Delete
                        </ActionButton>
                      </ActionsContainer>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </tbody>
          </AnalysisTable>
        </TableContainer>
      ) : (
        <EmptyState>
          {searchDate ? (
            <p>No analyses found for the selected date. Try a different date or clear the filter.</p>
          ) : (
            <p>No analyses have been added yet.</p>
          )}
        </EmptyState>
      )}
    </ListContainer>
  );
};

export default AnalysisList;