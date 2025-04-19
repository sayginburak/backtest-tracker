import { useState, createContext, useContext, useEffect } from 'react';
import styled from '@emotion/styled';
import './App.css';
import { BacktestProvider } from './context/BacktestContext';
import { FormProvider, useForm } from './context/FormContext';
import BacktestForm from './components/BacktestForm';
import BacktestList from './components/BacktestList';
import AnalysisList from './components/AnalysisList';
import CalendarView from './components/CalendarView';
import BurndownChart from './components/BurndownChart';


import AddAnalysisPage from './components/AddAnalysisPage';

// Create a context for the selected filter date
interface FilterContextType {
  filterDate: string;
  setFilterDate: (date: string) => void;
}

// Create a context for tab management
interface TabContextType {
  activeTab: 'dashboard' | 'add-backtest' | 'add-analysis';
  setActiveTab: (tab: 'dashboard' | 'add-backtest' | 'add-analysis') => void;
}

const FilterContext = createContext<FilterContextType>({
  filterDate: '',
  setFilterDate: () => {},
});

const TabContext = createContext<TabContextType>({
  activeTab: 'dashboard',
  setActiveTab: () => {},
});

export const useFilter = () => useContext(FilterContext);
export const useTab = () => useContext(TabContext);

const AppContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
`;

const Header = styled.header`
  text-align: center;
  margin-bottom: 30px;
`;

const Title = styled.h1`
  color: #333;
  margin-bottom: 5px;
  font-size: 2.2rem;
`;

const Subtitle = styled.p`
  color: #666;
  margin-top: 0;
  font-size: 1.1rem;
`;

const TabContainer = styled.div`
  display: flex;
  border-bottom: 1px solid #ddd;
  margin-bottom: 20px;
`;

const Tab = styled.div<{ active: boolean }>`
  padding: 10px 20px;
  cursor: pointer;
  color: ${props => props.active ? '#007bff' : '#333'};
  border-bottom: 2px solid ${props => props.active ? '#007bff' : 'transparent'};
  font-weight: ${props => props.active ? '600' : '400'};
  
  &:hover {
    color: #007bff;
  }
`;

function AppContent() {
  const { activeTab, setActiveTab } = useTab();
  const { pendingDuplicate } = useForm();
  const showAdminTabs = import.meta.env.VITE_SHOW_ADMIN_TABS === 'true';
  const isProd = import.meta.env.PROD;

  // If we're in production and trying to view an admin tab, redirect to dashboard
  useEffect(() => {
    if (!showAdminTabs && (activeTab === 'add-backtest' || activeTab === 'add-analysis')) {
      setActiveTab('dashboard');
    }
  }, [activeTab, showAdminTabs, setActiveTab]);

  // Switch to the add-backtest tab if there's a pending duplicate
  useEffect(() => {
    if (pendingDuplicate && showAdminTabs) {
      setActiveTab('add-backtest');
    }
  }, [pendingDuplicate, showAdminTabs, setActiveTab]);

  // Only show navigation if we're in development mode OR we have admin tabs to show
  const shouldShowNavigation = !isProd || showAdminTabs;

  return (
    <>

      
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
                  active={activeTab === 'add-analysis'}
                  onClick={() => setActiveTab('add-analysis')}
                >
                  Add Analysis
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
            <AnalysisList />
          </>
        )}

        {activeTab === 'add-backtest' && showAdminTabs && (
          <BacktestForm />
        )}

        {activeTab === 'add-analysis' && showAdminTabs && (
          <AddAnalysisPage />
        )}

        
      </AppContainer>
    </>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'add-backtest' | 'add-analysis'>('dashboard');
  const [filterDate, setFilterDate] = useState<string>('');

  return (
    <BacktestProvider>
      <FormProvider>
        <FilterContext.Provider value={{ filterDate, setFilterDate }}>
          <TabContext.Provider value={{ activeTab, setActiveTab }}>
            <AppContent />
          </TabContext.Provider>
        </FilterContext.Provider>
      </FormProvider>
    </BacktestProvider>
  );
}

export default App;
