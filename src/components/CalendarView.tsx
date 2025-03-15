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

const DateIndicator = styled.div<{ count: number; isComplete: boolean }>`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 12px;
  font-weight: bold;
  margin-top: 2px;
  background-color: ${props => props.isComplete ? '#4caf50' : props.count > 0 ? '#ff9800' : 'transparent'};
  color: ${props => props.count > 0 ? 'white' : 'inherit'};
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
    const count = dayProgress?.backtests.length || 0;
    const isComplete = dayProgress?.isComplete || false;

    return (
      <div>
        <DateIndicator count={count} isComplete={isComplete}>
          {count > 0 ? count : ''}
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
    const hasEntries = dayProgress && dayProgress.backtests.length > 0;
    
    if (!dayProgress) {
      return (
        <SelectedDateInfo>
          <InfoTitle>No data for {format(selectedDate, 'MMMM d, yyyy')}</InfoTitle>
          <p>No backtests have been recorded for this date.</p>
        </SelectedDateInfo>
      );
    }
    
    return (
      <SelectedDateInfo>
        <InfoTitle>{format(selectedDate, 'MMMM d, yyyy')}</InfoTitle>
        
        <StatItem>
          <StatLabel>Backtests completed:</StatLabel>
          <StatValue>{dayProgress.backtests.length}</StatValue>
        </StatItem>
        
        <StatItem>
          <StatLabel>Status:</StatLabel>
          <StatValue>
            {dayProgress.isComplete ? 'Complete ✅' : 'Incomplete ❌'}
          </StatValue>
        </StatItem>
        
        <StatItem>
          <StatLabel>Backtests needed:</StatLabel>
          <StatValue>
            {dayProgress.isComplete 
              ? 'Minimum requirement met' 
              : `${5 - dayProgress.backtests.length} more needed`}
          </StatValue>
        </StatItem>

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