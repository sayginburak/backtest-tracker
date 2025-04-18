import React, { useEffect } from 'react';
import styled from '@emotion/styled';
import { format, parseISO } from 'date-fns';
import { useBacktest } from '../context/BacktestContext';
import { useForm } from '../context/FormContext';
import { useTab } from '../App';
import { useFilter } from '../App';
import { Backtest } from '../types';

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

const BacktestTable = styled.table`
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

const DuplicateButton = styled.button`
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 5px 10px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: background-color 0.2s;

  &:hover {
    background-color: #218838;
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

const ChartLink = styled.a`
  color: #007bff;
  text-decoration: none;
  font-weight: 500;
  
  &:hover {
    text-decoration: underline;
    color: #0056b3;
  }
`;

const GreenText = styled.span`
  color: #28a745;
  font-weight: 500;
`;

const RedText = styled.span`
  color: #dc3545;
  font-weight: 500;
`;

const BacktestList: React.FC = () => {
  const { state, deleteBacktest } = useBacktest();
  const { duplicateBacktest } = useForm();
  const { setActiveTab } = useTab();
  const { filterDate, setFilterDate } = useFilter();
  const [searchDate, setSearchDate] = React.useState('');
  const isProduction = import.meta.env.PROD;

  useEffect(() => {
    if (filterDate) {
      setSearchDate(filterDate);
      
      const listElement = document.getElementById('backtest-list');
      if (listElement) {
        listElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [filterDate]);

  useEffect(() => {
    if (searchDate !== filterDate) {
      setFilterDate('');
    }
  }, [searchDate, setFilterDate, filterDate]);

  const allBacktests: Backtest[] = React.useMemo(() => {
    const backtests: Backtest[] = [];
    
    Object.values(state.dailyProgress).forEach(day => {
      day.backtests.forEach(backtest => {
        backtests.push(backtest);
      });
    });
    
    return backtests.sort((a, b) => {
      const dateComparison = new Date(b.datePerformed).getTime() - new Date(a.datePerformed).getTime();
      if (dateComparison !== 0) return dateComparison;
      return new Date(b.backtestDate).getTime() - new Date(a.backtestDate).getTime();
    });
  }, [state.dailyProgress]);

  const filteredBacktests = React.useMemo(() => {
    if (!searchDate) {
      return allBacktests;
    }
    
    return allBacktests.filter(backtest => 
      backtest.backtestDate.includes(searchDate) || 
      backtest.datePerformed.includes(searchDate)
    );
  }, [allBacktests, searchDate]);

  const handleClearFilter = () => {
    setSearchDate('');
    setFilterDate('');
  };

  const handleDeleteBacktest = (id: string) => {
    if (window.confirm('Are you sure you want to delete this backtest?')) {
      deleteBacktest(id);
    }
  };

  const handleDuplicateBacktest = (backtest: Backtest) => {
    duplicateBacktest(backtest);
    setActiveTab('add-backtest');
  };

  return (
    <ListContainer id="backtest-list">
      <ListTitle>Backtest Entries</ListTitle>
      
      <FilterContainer>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <FilterInput
            type="text"
            placeholder="Filter by date (YYYY-MM-DD)"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
          />
          {searchDate && (
            <ClearFilterButton onClick={handleClearFilter}>
              Clear Filter
            </ClearFilterButton>
          )}
        </div>
        <div>Total: {allBacktests.length} backtests{searchDate && ` (${filteredBacktests.length} filtered)`}</div>
      </FilterContainer>
      
      {filteredBacktests.length > 0 ? (
        <TableContainer>
          <BacktestTable>
            <TableHead>
              <tr>
                <TableHeader>Backtest Date</TableHeader>
                <TableHeader>Performed</TableHeader>
                <TableHeader>No Setup</TableHeader>
                <TableHeader>Liq Sweep</TableHeader>
                <TableHeader>Swing Time</TableHeader>
                <TableHeader>Obviousness</TableHeader>
                <TableHeader>MSS Time</TableHeader>
                <TableHeader>Timeframe</TableHeader>
                <TableHeader>Protected Swing</TableHeader>
                <TableHeader>Price Expanded</TableHeader>
                <TableHeader>Pips From Swing</TableHeader>
                <TableHeader>Pips From MSS</TableHeader>
                <TableHeader>Chart</TableHeader>
                <TableHeader>Liq Swing Type</TableHeader>
                <TableHeader>Convincing</TableHeader>
                {!isProduction && <TableHeader>Actions</TableHeader>}
              </tr>
            </TableHead>
            <tbody>
              {filteredBacktests.map((backtest) => (
                <TableRow key={backtest.id}>
                  <TableCell>
                    {!backtest.backtestDate ? (
                      <span style={{ color: 'red' }}>No date</span>
                    ) : (
                      <span>
                        {(() => {
                          try {
                            return format(parseISO(backtest.backtestDate), 'MMM dd, yyyy');
                          } catch (error) {
                            console.error(`Invalid backtestDate: ${backtest.backtestDate}`, error);
                            return <span style={{ color: 'red' }}>Invalid date: {String(backtest.backtestDate)}</span>;
                          }
                        })()}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {!backtest.datePerformed ? (
                      <span style={{ color: 'red' }}>No date</span>
                    ) : (
                      <span>
                        {(() => {
                          try {
                            return format(parseISO(backtest.datePerformed), 'MMM dd, yyyy');
                          } catch (error) {
                            console.error(`Invalid datePerformed: ${backtest.datePerformed}`, error);
                            return <span style={{ color: 'red' }}>Invalid date: {String(backtest.datePerformed)}</span>;
                          }
                        })()}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {backtest.noSetupFound ? 
                      <RedText>Yes</RedText> : 
                      'No'
                    }
                  </TableCell>
                  <TableCell>
                    {backtest.noSetupFound ? '—' : (backtest.hasLiqSweep ? 'Yes' : 'No')}
                  </TableCell>
                  <TableCell>{backtest.noSetupFound ? '—' : backtest.swingFormationTime}</TableCell>
                  <TableCell>{backtest.noSetupFound ? '—' : `${backtest.obviousnessRating}/10`}</TableCell>
                  <TableCell>{backtest.noSetupFound ? '—' : backtest.mssTime}</TableCell>
                  <TableCell>{backtest.noSetupFound ? '—' : backtest.timeframe}</TableCell>
                  <TableCell>
                    {backtest.noSetupFound ? '—' : (
                      backtest.isProtectedSwing ? 
                        <GreenText>Yes</GreenText> : 
                        <RedText>No</RedText>
                    )}
                  </TableCell>
                  <TableCell>
                    {backtest.noSetupFound ? '—' : (backtest.didPriceExpand ? 'Yes' : 'No')}
                  </TableCell>
                  <TableCell>{backtest.noSetupFound ? '—' : backtest.pipsFromSwingLow}</TableCell>
                  <TableCell>{backtest.noSetupFound ? '—' : backtest.pipsFromMSS}</TableCell>
                  <TableCell>
                    {backtest.chartUrl ? (
                      <ChartLink 
                        href={backtest.chartUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        Chart
                      </ChartLink>
                    ) : '—'}
                  </TableCell>
                  <TableCell>{backtest.noSetupFound ? '—' : (backtest.liqSwingType || '—')}</TableCell>
                  <TableCell>{backtest.noSetupFound ? '—' : (backtest.convincingRating ? `${backtest.convincingRating}/10` : '—')}</TableCell>
                  {!isProduction && (
                    <TableCell>
                      <ActionsContainer>
                        <DuplicateButton onClick={() => handleDuplicateBacktest(backtest)}>
                          Duplicate
                        </DuplicateButton>
                        <ActionButton onClick={() => handleDeleteBacktest(backtest.id)}>
                          Delete
                        </ActionButton>
                      </ActionsContainer>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </tbody>
          </BacktestTable>
        </TableContainer>
      ) : (
        <EmptyState>No backtest entries found. Add some using the form above.</EmptyState>
      )}
    </ListContainer>
  );
};

export default BacktestList; 