import React, { useState, createContext, useContext } from 'react';
import styled from '@emotion/styled';
import './App.css';
import { BacktestProvider } from './context/BacktestContext';
import BacktestForm from './components/BacktestForm';
import BacktestList from './components/BacktestList';
import CalendarView from './components/CalendarView';
import BurndownChart from './components/BurndownChart';
import DataExportImport from './components/DataExportImport';
import AutoSync from './components/AutoSync';

// Create a context for the selected filter date
interface FilterContextType {
  filterDate: string;
  setFilterDate: (date: string) => void;
}

export const FilterContext = createContext<FilterContextType>({
  filterDate: '',
  setFilterDate: () => {}
});

export const useFilter = () => useContext(FilterContext);

const AppContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 20px;
  background-color: #f5f5f5;
`;

const Header = styled.header`
  margin-bottom: 30px;
  text-align: center;
  background-color: #ffffff;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 10px;
  color: #333;
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 0;
`;

const TabContainer = styled.div`
  display: flex;
  margin-bottom: 20px;
  background-color: #fff;
  border-radius: 8px;
  padding: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Tab = styled.button<{ active: boolean }>`
  padding: 10px 20px;
  background-color: ${props => props.active ? '#007bff' : 'transparent'};
  color: ${props => props.active ? 'white' : '#333'};
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
  margin-right: 10px;

  &:hover {
    background-color: ${props => props.active ? '#0069d9' : '#f0f0f0'};
  }

  &:last-child {
    margin-right: 0;
  }
`;

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'add-backtest' | 'data'>('dashboard');
  const showAdminTabs = import.meta.env.VITE_SHOW_ADMIN_TABS === 'true';
  const [filterDate, setFilterDate] = useState<string>('');
  const isProd = import.meta.env.PROD;

  // If we're in production and trying to view an admin tab, redirect to dashboard
  React.useEffect(() => {
    if (!showAdminTabs && (activeTab === 'add-backtest' || activeTab === 'data')) {
      setActiveTab('dashboard');
    }
  }, [activeTab, showAdminTabs]);

  // Only show navigation if we're in development mode OR we have admin tabs to show
  const shouldShowNavigation = !isProd || showAdminTabs;

  return (
    <BacktestProvider>
      {/* AutoSync component will handle background syncing */}
      <AutoSync />
      
      <FilterContext.Provider value={{ filterDate, setFilterDate }}>
        <AppContainer>
          <Header>
            <Title>Trading Backtest Tracker</Title>
            <Subtitle>Track your daily backtests and analyze your progress</Subtitle>
          </Header>

          {shouldShowNavigation && (
            <TabContainer>
              <Tab 
                active={activeTab === 'dashboard'}
                onClick={() => setActiveTab('dashboard')}
              >
                Dashboard
              </Tab>
              {showAdminTabs && (
                <>
                  <Tab 
                    active={activeTab === 'add-backtest'}
                    onClick={() => setActiveTab('add-backtest')}
                  >
                    Add New Backtest
                  </Tab>
                  <Tab 
                    active={activeTab === 'data'}
                    onClick={() => setActiveTab('data')}
                  >
                    Data Management
                  </Tab>
                </>
              )}
            </TabContainer>
          )}

          {activeTab === 'dashboard' && (
            <>
              <CalendarView />
              <BurndownChart />
              <BacktestList />
            </>
          )}

          {activeTab === 'add-backtest' && showAdminTabs && (
            <BacktestForm />
          )}

          {activeTab === 'data' && showAdminTabs && (
            <DataExportImport />
          )}
        </AppContainer>
      </FilterContext.Provider>
    </BacktestProvider>
  );
}

export default App;
