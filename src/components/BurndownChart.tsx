import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import styled from '@emotion/styled';
import { format, subDays, isBefore, startOfMonth, endOfMonth, isWeekend, isBefore as isBeforeDate, parseISO } from 'date-fns';
import { useBacktest } from '../context/BacktestContext';
import { Analysis } from '../types';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const ChartContainer = styled.div`
  background-color: #ffffff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
`;

const ChartWrapper = styled.div`
  width: 100%;
  height: 400px; /* Make the chart taller for better visibility */
  margin-bottom: 20px;
`;

const ChartTitle = styled.h2`
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
  font-size: 1.5rem;
`;

const FilterContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
`;

const SelectFilter = styled.select`
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.9rem;
  width: 150px;
  color: #333;
  background-color: #fff;
  
  &:focus {
    border-color: #007bff;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
    outline: none;
  }
`;

const StatText = styled.p`
  color: #333;
  margin: 8px 0;
  font-size: 0.95rem;
  
  strong {
    font-weight: 600;
    color: #555;
  }
`;

const BurndownChart: React.FC = () => {
  const { state } = useBacktest();
  const [period, setPeriod] = useState<'7days' | '30days' | 'month'>('30days');
  const [chartData, setChartData] = useState<any>({ labels: [], datasets: [] });
  
  useEffect(() => {
    generateChartData();
  }, [state.dailyProgress, period]);

  const generateDateRange = (): Date[] => {
    const today = new Date();
    const dates: Date[] = [];

    if (period === '7days') {
      for (let i = 6; i >= 0; i--) {
        dates.push(subDays(today, i));
      }
    } else if (period === '30days') {
      for (let i = 29; i >= 0; i--) {
        dates.push(subDays(today, i));
      }
    } else if (period === 'month') {
      const firstDay = startOfMonth(today);
      const lastDay = endOfMonth(today);
      let currentDate = new Date(firstDay);
      
      while (isBefore(currentDate, lastDay) || currentDate.getDate() === lastDay.getDate()) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    return dates;
  };

  const generateChartData = () => {
    const dateRange = generateDateRange();
    const startDate = parseISO('2025-03-11'); // March 11, 2025 as start date
    
    // Prepare labels for the chart (x-axis) - show day names for weekends
    const labels = dateRange.map(date => {
      if (isWeekend(date)) {
        return format(date, 'EEEE'); // Day name for weekends (Saturday, Sunday)
      }
      return format(date, 'MMM dd');
    });
    
    // Check if the dailyProgress object has any data
    const progressKeys = Object.keys(state.dailyProgress);
    
    // Count unique backtest dates for each day
    let totalBacktests = 0;
    progressKeys.forEach(dateKey => {
      const uniqueDatesCount = new Set(state.dailyProgress[dateKey]?.backtests.map((bt: any) => bt.backtestDate)).size;
      totalBacktests += uniqueDatesCount;
    });

    // Calculate total entries (unique backtest dates + analyses) per day
    const totalEntriesData = dateRange.map(date => {
      const dateKey = format(date, 'yyyy-MM-dd');
      const dayProgress = state.dailyProgress[dateKey];
      const dateAnalyses = state.analyses[dateKey] || [];
      
      // Count unique backtest dates
      const uniqueBacktestDates = dayProgress ? new Set(dayProgress.backtests.map((bt: any) => bt.backtestDate)).size : 0;
      
      // Count analyses
      const analysesCount = dateAnalyses.length;
      
      // Return the combined total
      return uniqueBacktestDates + analysesCount;
    });
    
    // Cumulative total entries (total done so far)
    const cumulativeTotalData = [];
    let runningTotal = 0;
    for (const count of totalEntriesData) {
      runningTotal += count;
      cumulativeTotalData.push(runningTotal);
    }
    
    // Daily target line (constant at 5)
    const dailyTargetData = Array(dateRange.length).fill(5);
    
    // Ideal cumulative progress (5 backtests per work day)
    const idealCumulativeData = [];
    let idealTotal = 0;
    
    for (let i = 0; i < dateRange.length; i++) {
      const currentDate = dateRange[i];
      
      // Only start counting from the start date
      if (isBeforeDate(currentDate, startDate)) {
        idealCumulativeData.push(0);
        continue;
      }
      
      // Only increase the ideal count on weekdays
      if (!isWeekend(currentDate)) {
        idealTotal += 5; // Add 5 for each weekday
      }
      
      idealCumulativeData.push(idealTotal);
    }
    
    // Set chart data
    setChartData({
      labels,
      datasets: [
        {
          label: 'Total Entries',
          data: totalEntriesData,
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          tension: 0.1,
          borderWidth: 2,
          pointRadius: 4,
        },
        {
          label: 'Cumulative Total Entries',
          data: cumulativeTotalData,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          tension: 0.1,
          borderWidth: 2,
          pointRadius: 4,
        },
        {
          label: 'Daily Target (5)',
          data: dailyTargetData,
          borderColor: 'rgba(255, 99, 132, 0.8)',
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0,
          borderWidth: 2,
        },
        {
          label: 'Ideal Progress (Weekdays Only)',
          data: idealCumulativeData,
          borderColor: 'rgba(153, 102, 255, 0.8)',
          borderDash: [3, 3],
          fill: false,
          pointRadius: 0,
          borderWidth: 2,
        }
      ],
    });
  };

  return (
    <ChartContainer>
      <ChartTitle>Progress Chart</ChartTitle>
      
      <FilterContainer>
        <label htmlFor="period-filter">Time Period:</label>
        <SelectFilter 
          id="period-filter" 
          value={period} 
          onChange={(e) => setPeriod(e.target.value as any)}
        >
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
          <option value="month">This Month</option>
        </SelectFilter>
      </FilterContainer>
      
      <ChartWrapper>
        <Line 
          data={chartData} 
          options={{
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Number of Entries',
                  color: '#333',
                },
                ticks: {
                  color: '#333',
                },
              },
              x: {
                title: {
                  display: true,
                  text: 'Date',
                  color: '#333',
                },
                ticks: {
                  color: '#333',
                },
              },
            },
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  color: '#333',
                  font: {
                    size: 12,
                  },
                },
              },
              tooltip: {
                mode: 'index',
                intersect: false,
              },
            },
          }} 
        />
      </ChartWrapper>
      
      <div style={{ marginTop: '20px' }}>
        <StatText>
          <strong>Current streak:</strong> {state.currentStreak} day(s)
        </StatText>
        <StatText>
          <strong>Total backtests completed:</strong> {state.totalBacktests}
        </StatText>
        <StatText>
          <strong>Total analyses completed:</strong> {state.totalAnalyses}
        </StatText>
      </div>
    </ChartContainer>
  );
};

export default BurndownChart;