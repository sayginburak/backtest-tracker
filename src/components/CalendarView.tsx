import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import styled from '@emotion/styled';
import { format } from 'date-fns';
import { useBacktest } from '../context/BacktestContext';
import { useFilter } from '../App';

// Define proper types for react-calendar
type Value = Date | null | [Date | null, Date | null];

const CalendarContainer = styled.div`
  background-color: #ffffff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;

  .react-calendar {
    width: 100%;
    border: none;
    border-radius: 8px;
    font-family: inherit;
  }

  .react-calendar__tile {
    height: 60px;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    padding: 5px;
  }

  .react-calendar__navigation button {
    color: #333;
  }

  .react-calendar__month-view__weekdays__weekday {
    color: #333;
    text-decoration: none;
    text-transform: uppercase;
    font-size: 0.8em;
  }

  .react-calendar__month-view__weekdays__weekday abbr {
    text-decoration: none;
  }

  .react-calendar__month-view__days__day {
    color: #333;
  }
`;

const CalendarTitle = styled.h2`
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
  font-size: 1.5rem;
`;

const DateIndicator = styled.div<{ count: number; isComplete: boolean; hasAnalyses: boolean; hasBacktests: boolean }>`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 12px;
  font-weight: bold;
  margin-top: 2px;
  background-color: ${props => {
    if (props.isComplete) return '#4caf50'; // Green for complete
    if (props.hasAnalyses && props.hasBacktests) return '#9c27b0'; // Purple for both
    if (props.hasAnalyses) return '#2196f3'; // Blue for analyses
    if (props.hasBacktests) return '#ff9800'; // Orange for backtests
    return 'transparent';
  }};
  color: ${props => (props.hasAnalyses || props.hasBacktests) ? 'white' : 'inherit'};
`;

const SelectedDateInfo = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 15px;
  margin-top: 20px;
  border: 1px solid #e0e0e0;
`;

const InfoTitle = styled.h3`
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 1.2rem;
  color: #333;
`;

const StatItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }
`;

const StatLabel = styled.span`
  font-weight: 500;
  color: #555;
`;

const StatValue = styled.span`
  font-weight: 400;
  color: #333;
`;

const ViewEntriesButton = styled.button`
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  margin-top: 15px;
  cursor: pointer;
  font-size: 0.9rem;
  width: 100%;
  transition: background-color 0.2s;

  &:hover {
    background-color: #0069d9;
  }

  &:disabled {
    background-color: #e9ecef;
    color: #6c757d;
    cursor: not-allowed;
  }
`;

const CalendarView: React.FC = () => {
  const { state } = useBacktest();
  const { setFilterDate } = useFilter();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const formatDateKey = (date: Date): string => {
    return format(date, 'yyyy-MM-dd');
  };

  const getTileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null;

    const dateKey = formatDateKey(date);
    const dayProgress = state.dailyProgress[dateKey];
    const dateAnalyses = state.analyses[dateKey] || [];
    
    // Check if there are backtests or analyses for this date
    const hasBacktests = dayProgress && dayProgress.backtests.length > 0;
    const hasAnalyses = dateAnalyses.length > 0;
    
    // Count unique backtest dates and analyses
    const uniqueDatesCount = hasBacktests 
      ? new Set(dayProgress.backtests.map(bt => bt.backtestDate)).size 
      : 0;
    const analysesCount = dateAnalyses.length;
    
    // Mark as complete when combined total is 5 or more
    const isComplete = (uniqueDatesCount + analysesCount) >= 5;
    
    if (!hasBacktests && !hasAnalyses) {
      return (
        <div>
          <DateIndicator count={0} isComplete={false} hasAnalyses={false} hasBacktests={false}>
            {''}
          </DateIndicator>
        </div>
      );
    }
    
    // Display the combined count of unique backtests and analyses
    const displayCount = uniqueDatesCount + analysesCount;

    return (
      <div>
        <DateIndicator 
          count={displayCount} 
          isComplete={isComplete} 
          hasAnalyses={hasAnalyses} 
          hasBacktests={hasBacktests}
        >
          {displayCount > 0 ? displayCount : ''}
        </DateIndicator>
      </div>
    );
  };

  const handleDateChange = (value: Value) => {
    if (value instanceof Date) {
      setSelectedDate(value);
    }
  };

  const handleViewEntries = () => {
    const dateKey = formatDateKey(selectedDate);
    setFilterDate(dateKey);
  };

  const renderSelectedDateInfo = () => {
    const dateKey = formatDateKey(selectedDate);
    const dayProgress = state.dailyProgress[dateKey];
    const dateAnalyses = state.analyses[dateKey] || [];
    
    const hasBacktests = dayProgress && dayProgress.backtests.length > 0;
    const hasAnalyses = dateAnalyses.length > 0;
    const hasEntries = hasBacktests || hasAnalyses;
    
    if (!hasEntries) {
      return (
        <SelectedDateInfo>
          <InfoTitle>No data for {format(selectedDate, 'MMMM d, yyyy')}</InfoTitle>
          <p>No backtests or analyses have been recorded for this date.</p>
        </SelectedDateInfo>
      );
    }
    
    // Count unique backtest dates and analyses
    const uniqueDatesCount = hasBacktests 
      ? new Set(dayProgress.backtests.map(bt => bt.backtestDate)).size 
      : 0;
    const analysesCount = dateAnalyses.length;
    
    // Determine completion status based on combined total
    const isComplete = (uniqueDatesCount + analysesCount) >= 5;
    
    // Calculate what's needed to complete the day
    const backtestsNeeded = 5 - uniqueDatesCount;
    const analysesNeeded = 5 - analysesCount;
    
    return (
      <SelectedDateInfo>
        <InfoTitle>{format(selectedDate, 'MMMM d, yyyy')}</InfoTitle>
        
        {hasBacktests && (
          <>
            <StatItem>
              <StatLabel>Unique backtest dates:</StatLabel>
              <StatValue>{uniqueDatesCount}</StatValue>
            </StatItem>
            
            <StatItem>
              <StatLabel>Total backtest entries:</StatLabel>
              <StatValue>{dayProgress.backtests.length}</StatValue>
            </StatItem>
          </>
        )}
        
        {hasAnalyses && (
          <StatItem>
            <StatLabel>Total analyses:</StatLabel>
            <StatValue>{analysesCount}</StatValue>
          </StatItem>
        )}
        
        <StatItem>
          <StatLabel>Status:</StatLabel>
          <StatValue>
            {isComplete ? 'Complete ✅' : 'Incomplete ❌'}
          </StatValue>
        </StatItem>
        
        {!isComplete && (
          <StatItem>
            <StatLabel>To complete:</StatLabel>
            <StatValue>
              {uniqueDatesCount > 0 || analysesCount > 0 ?
                // If we have both backtests and analyses, show the combined requirement
                (uniqueDatesCount > 0 && analysesCount > 0) ?
                  `${Math.max(0, 5 - (uniqueDatesCount + analysesCount))} more unique backtest dates or analyses needed` :
                // Otherwise show the specific requirement based on what we have
                uniqueDatesCount > 0 ?
                  `${backtestsNeeded} more unique backtest dates needed` :
                  `${analysesNeeded} more analyses needed` :
                // If we have neither, show the general requirement
                `Need 5 unique backtest dates OR 5 analyses`}
            </StatValue>
          </StatItem>
        )}

        <ViewEntriesButton 
          onClick={handleViewEntries}
          disabled={!hasEntries}
        >
          View Entries for This Day
        </ViewEntriesButton>
      </SelectedDateInfo>
    );
  };

  return (
    <CalendarContainer>
      <CalendarTitle>Progress Calendar</CalendarTitle>
      <Calendar 
        onChange={handleDateChange} 
        value={selectedDate} 
        tileContent={getTileContent}
      />
      {renderSelectedDateInfo()}
    </CalendarContainer>
  );
};

export default CalendarView;