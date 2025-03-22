import React, { useState, useEffect } from 'react';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, setHours, setMinutes, parseISO, startOfDay } from 'date-fns';
import { useBacktest } from '../context/BacktestContext';
import { useForm } from '../context/FormContext';
import { Backtest } from '../types';
import styled from '@emotion/styled';

// Add this to declare the _isHandlingDuplicate property on the Window interface
declare global {
  interface Window {
    _isHandlingDuplicate?: boolean;
  }
}

const FormContainer = styled.div`
  background-color: #ffffff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
`;

const FormTitle = styled.h2`
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
  font-size: 1.5rem;
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #333;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
  color: #333;
  background-color: #fff;
  
  &:focus {
    border-color: #007bff;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
    outline: none;
  }
`;

const RadioGroup = styled.div`
  display: flex;
  gap: 15px;
  margin-top: 5px;
`;

const RadioLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  color: #333;
`;

const Select = styled.select`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
  color: #333;
  background-color: #fff;
  
  &:focus {
    border-color: #007bff;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
    outline: none;
  }
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
  margin-left: 10px;

  &:hover {
    background-color: #5a6268;
  }
`;

const BacktestForm: React.FC = () => {
  const { addBacktest } = useBacktest();
  const { pendingDuplicate, clearDuplicate } = useForm();
  const [backtestDate, setBacktestDate] = useState<Date | null>(new Date());
  const [datePerformed, setDatePerformed] = useState<Date | null>(new Date());
  const [noSetupFound, setNoSetupFound] = useState<boolean>(false);
  const [hasLiqSweep, setHasLiqSweep] = useState<boolean>(false);
  const [swingFormationTime, setSwingFormationTime] = useState<Date | null>(null);
  const [obviousnessRating, setObviousnessRating] = useState<number>(5);
  const [liqSwingType, setLiqSwingType] = useState<string>('PDH/PDL');
  const [convincingRating, setConvincingRating] = useState<number>(5);
  const [mssTime, setMssTime] = useState<Date | null>(null);
  const [timeframe, setTimeframe] = useState<'1m' | '5m'>('5m');
  const [isProtectedSwing, setIsProtectedSwing] = useState<boolean>(false);
  const [didPriceExpand, setDidPriceExpand] = useState<boolean>(false);
  const [pipsFromSwingLow, setPipsFromSwingLow] = useState<number>(0);
  const [pipsFromMSS, setPipsFromMSS] = useState<number>(0);
  const [chartUrl, setChartUrl] = useState<string>('');

  // Fill form with duplicate backtest data when available
  useEffect(() => {
    if (pendingDuplicate) {
      console.log("========== DUPLICATE DIAGNOSTICS ==========");
      console.log("Original backtest:", JSON.stringify(pendingDuplicate, null, 2));
      
      try {
        // CRITICAL FIX: Handle backtest date specifically with timezone safety
        // Convert to a safe date format by explicitly handling only the date part
        const backtestDateStr = pendingDuplicate.backtestDate;
        console.log("Original backtest date string:", backtestDateStr);
        
        // Create a date at the start of the day in local timezone to avoid offset issues
        const backtestDateObj = startOfDay(parseISO(backtestDateStr));
        console.log("Parsed backtest date object:", backtestDateObj);
        console.log("Backtest date toISOString:", backtestDateObj.toISOString());
        console.log("Backtest date toString:", backtestDateObj.toString());
        
        // Set duplicating flag to prevent second useEffect from running
        window._isHandlingDuplicate = true;
        
        setBacktestDate(backtestDateObj);
        
        // Preserve the original datePerformed instead of using today's date
        if (pendingDuplicate.datePerformed) {
          const datePerformedObj = startOfDay(parseISO(pendingDuplicate.datePerformed));
          console.log("Using original datePerformed:", datePerformedObj.toString());
          setDatePerformed(datePerformedObj);
        } else {
          // Fallback to today's date only if original doesn't exist
          const todayDate = startOfDay(new Date());
          console.log("No datePerformed in original, using today:", todayDate.toString());
          setDatePerformed(todayDate);
        }
        
        // Set other form fields
        setNoSetupFound(pendingDuplicate.noSetupFound);
        setHasLiqSweep(pendingDuplicate.hasLiqSweep);
        
        // Handle swing formation time - prioritize full datetime if available
        if (pendingDuplicate.swingFormationDateTime) {
          console.log("Using full swing formation datetime:", pendingDuplicate.swingFormationDateTime);
          // Parse full datetime string directly
          const swingTime = parseISO(pendingDuplicate.swingFormationDateTime);
          console.log("Final swing time object:", swingTime);
          
          setSwingFormationTime(swingTime);
        } else if (pendingDuplicate.swingFormationTime) {
          console.log("Using legacy swing formation time:", pendingDuplicate.swingFormationTime);
          // Parse time carefully to avoid timezone issues
          const [hoursStr, minutesStr] = pendingDuplicate.swingFormationTime.split(':');
          const hours = parseInt(hoursStr, 10);
          const minutes = parseInt(minutesStr, 10);
          console.log(`Parsed swing time components - hours: ${hours}, minutes: ${minutes}`);
          
          // Create a new date object at the start of the day to avoid timezone issues
          const swingTime = new Date(backtestDateObj);
          // Set hours and minutes explicitly
          swingTime.setHours(hours);
          swingTime.setMinutes(minutes);
          swingTime.setSeconds(0);
          swingTime.setMilliseconds(0);
          
          console.log("Created swing time object:", swingTime);
          console.log("Formatted time:", format(swingTime, 'yyyy-MM-dd HH:mm'));
          
          setSwingFormationTime(swingTime);
        }
        
        // Handle MSS time - prioritize full datetime if available
        if (pendingDuplicate.mssDateTime) {
          console.log("Using full MSS datetime:", pendingDuplicate.mssDateTime);
          // Parse full datetime string directly
          const mssTime = parseISO(pendingDuplicate.mssDateTime);
          console.log("Final MSS time object:", mssTime);
          
          setMssTime(mssTime);
        } else if (pendingDuplicate.mssTime) {
          console.log("Using legacy MSS time:", pendingDuplicate.mssTime);
          // Parse time carefully to avoid timezone issues
          const [hoursStr, minutesStr] = pendingDuplicate.mssTime.split(':');
          const hours = parseInt(hoursStr, 10);
          const minutes = parseInt(minutesStr, 10);
          console.log(`Parsed MSS time components - hours: ${hours}, minutes: ${minutes}`);
          
          // Create a new date object at the start of the day to avoid timezone issues
          const mssTimeObj = new Date(backtestDateObj);
          // Set hours and minutes explicitly
          mssTimeObj.setHours(hours);
          mssTimeObj.setMinutes(minutes);
          mssTimeObj.setSeconds(0);
          mssTimeObj.setMilliseconds(0);
          
          console.log("Created MSS time object:", mssTimeObj);
          console.log("Formatted time:", format(mssTimeObj, 'yyyy-MM-dd HH:mm'));
          
          setMssTime(mssTimeObj);
        }
        
        // Set the remaining fields
        setObviousnessRating(pendingDuplicate.obviousnessRating);
        setLiqSwingType(pendingDuplicate.liqSwingType || 'PDH/PDL');
        setConvincingRating(pendingDuplicate.convincingRating || 5);
        setTimeframe(pendingDuplicate.timeframe as '1m' | '5m');
        setIsProtectedSwing(pendingDuplicate.isProtectedSwing);
        setDidPriceExpand(pendingDuplicate.didPriceExpand);
        setPipsFromSwingLow(pendingDuplicate.pipsFromSwingLow);
        setPipsFromMSS(pendingDuplicate.pipsFromMSS);
        setChartUrl(pendingDuplicate.chartUrl || '');
        console.log("========== END DUPLICATE DIAGNOSTICS ==========");
        
        // Reset duplicating flag after a short delay
        setTimeout(() => {
          window._isHandlingDuplicate = false;
        }, 500);
      } catch (error) {
        console.error("Error parsing backtest data for duplication:", error);
        resetForm();
        window._isHandlingDuplicate = false;
      } finally {
        // Delay clearing the duplicate to ensure state updates have time to complete
        // This is important for React's asynchronous state updates
        setTimeout(() => {
          clearDuplicate();
          console.log("Duplicate data cleared after timeout");
        }, 1000);
      }
    }
  }, [pendingDuplicate, clearDuplicate]);

  // Fix circular dependency in the date change effect
  useEffect(() => {
    // Skip this effect if we're handling a duplicate to prevent circular updates
    if (backtestDate && !window._isHandlingDuplicate) {
      console.log("Date effect running for backtestDate:", format(backtestDate, 'yyyy-MM-dd'));
      
      // Only initialize time values if they don't already exist
      if (!swingFormationTime) {
        const newTime = setHours(setMinutes(new Date(backtestDate), 0), 9);
        console.log("Setting default swingFormationTime:", format(newTime, 'HH:mm'));
        setSwingFormationTime(newTime);
      } else {
        // Preserve the existing time but update the date
        const newSwingTime = new Date(backtestDate);
        newSwingTime.setHours(
          swingFormationTime.getHours(),
          swingFormationTime.getMinutes(),
          0,
          0
        );
        console.log("Updating swingFormationTime to:", format(newSwingTime, 'yyyy-MM-dd HH:mm'));
        setSwingFormationTime(newSwingTime);
      }

      if (!mssTime) {
        const newTime = setHours(setMinutes(new Date(backtestDate), 0), 10);
        console.log("Setting default mssTime:", format(newTime, 'HH:mm'));
        setMssTime(newTime);
      } else {
        // Preserve the existing time but update the date
        const newMssTime = new Date(backtestDate);
        newMssTime.setHours(
          mssTime.getHours(),
          mssTime.getMinutes(),
          0,
          0
        );
        console.log("Updating mssTime to:", format(newMssTime, 'yyyy-MM-dd HH:mm'));
        setMssTime(newMssTime);
      }
    }
  }, [backtestDate]); // Only depend on backtestDate to avoid circular dependency

  // Fix the time pickers to handle changes properly
  const handleSwingTimeChange = (date: Date | null) => {
    if (!date) return;
    console.log("handleSwingTimeChange called with:", date);
    
    // Respect the selected date completely - don't force it to use backtestDate
    // Only ensure the date is clean by setting seconds and milliseconds to 0
    const cleanDate = new Date(date);
    cleanDate.setSeconds(0);
    cleanDate.setMilliseconds(0);
    
    console.log("Setting swing time to selected date:", cleanDate);
    console.log("Formatted time:", format(cleanDate, 'yyyy-MM-dd HH:mm'));
    
    // Set flag to prevent the date effect from firing
    window._isHandlingDuplicate = true;
    setSwingFormationTime(cleanDate);
    
    // Clear flag after a short delay
    setTimeout(() => {
      window._isHandlingDuplicate = false;
    }, 100);
  };

  const handleMssTimeChange = (date: Date | null) => {
    if (!date) return;
    console.log("handleMssTimeChange called with:", date);
    
    // Respect the selected date completely - don't force it to use backtestDate
    // Only ensure the date is clean by setting seconds and milliseconds to 0
    const cleanDate = new Date(date);
    cleanDate.setSeconds(0);
    cleanDate.setMilliseconds(0);
    
    console.log("Setting MSS time to selected date:", cleanDate);
    console.log("Formatted time:", format(cleanDate, 'yyyy-MM-dd HH:mm'));
    
    // Set flag to prevent the date effect from firing
    window._isHandlingDuplicate = true;
    setMssTime(cleanDate);
    
    // Clear flag after a short delay
    setTimeout(() => {
      window._isHandlingDuplicate = false;
    }, 100);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!backtestDate) {
      alert('Please select a backtest date');
      return;
    }

    if (!datePerformed) {
      alert('Please select when the backtest was performed');
      return;
    }

    // Only validate these fields if no setup is not found
    if (!noSetupFound) {
      if (!swingFormationTime) {
        alert('Please select when the swing high/low was formed');
        return;
      }

      if (!mssTime) {
        alert('Please select when MSS came after the sweep');
        return;
      }
    }

    // Use startOfDay to ensure dates are timezone-safe
    const backtestDateFormatted = format(startOfDay(backtestDate), 'yyyy-MM-dd');
    const datePerformedFormatted = format(startOfDay(datePerformed), 'yyyy-MM-dd');

    // Store full datetime information for time fields
    // Format: Store the time and also the full date for reference
    const swingFormationTimeFormatted = !noSetupFound && swingFormationTime 
      ? {
          time: format(swingFormationTime, 'HH:mm'),
          fullDateTime: format(swingFormationTime, 'yyyy-MM-dd HH:mm')
        }
      : { time: '', fullDateTime: '' };
    
    const mssTimeFormatted = !noSetupFound && mssTime
      ? {
          time: format(mssTime, 'HH:mm'),
          fullDateTime: format(mssTime, 'yyyy-MM-dd HH:mm')
        }
      : { time: '', fullDateTime: '' };

    // Create the new backtest object
    const newBacktest: Omit<Backtest, 'id'> = {
      backtestDate: backtestDateFormatted,
      datePerformed: datePerformedFormatted,
      noSetupFound,
      hasLiqSweep: noSetupFound ? false : hasLiqSweep,
      swingFormationTime: swingFormationTimeFormatted.time, 
      swingFormationDateTime: swingFormationTimeFormatted.fullDateTime,
      obviousnessRating: noSetupFound ? 0 : obviousnessRating,
      mssTime: mssTimeFormatted.time,
      mssDateTime: mssTimeFormatted.fullDateTime,
      timeframe: noSetupFound ? '5m' : timeframe,
      isProtectedSwing: noSetupFound ? false : isProtectedSwing,
      didPriceExpand: noSetupFound ? false : didPriceExpand,
      pipsFromSwingLow: noSetupFound ? 0 : pipsFromSwingLow,
      pipsFromMSS: noSetupFound ? 0 : pipsFromMSS,
      chartUrl: chartUrl,
      liqSwingType: noSetupFound ? '' : liqSwingType,
      convincingRating: noSetupFound ? 0 : convincingRating
    };

    console.log("Submitting new backtest:", newBacktest);
    addBacktest(newBacktest);
    resetForm();
  };

  const resetForm = () => {
    const now = startOfDay(new Date());
    setBacktestDate(now);
    setDatePerformed(now);
    setNoSetupFound(false);
    setHasLiqSweep(false);
    setSwingFormationTime(setHours(setMinutes(new Date(now), 0), 9));
    setObviousnessRating(5);
    setLiqSwingType('PDH/PDL');
    setConvincingRating(5);
    setMssTime(setHours(setMinutes(new Date(now), 0), 10));
    setTimeframe('5m');
    setIsProtectedSwing(false);
    setDidPriceExpand(false);
    setPipsFromSwingLow(0);
    setPipsFromMSS(0);
    setChartUrl('');
    
    console.log("Form reset with date:", now);
  };

  return (
    <FormContainer>
      <FormTitle>Add New Backtest</FormTitle>
      <form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="backtestDate">
            Backtest Date:
            {backtestDate && (
              <span style={{ marginLeft: '5px', color: '#666', fontSize: '0.9rem' }}>
                (Current: {format(backtestDate, 'yyyy-MM-dd')})
              </span>
            )}
          </Label>
          <ReactDatePicker
            id="backtestDate"
            selected={backtestDate}
            onChange={(date) => {
              // When a new date is selected, ensure we use the start of day to avoid timezone issues
              if (date) {
                setBacktestDate(startOfDay(date));
              } else {
                setBacktestDate(null);
              }
            }}
            dateFormat="yyyy-MM-dd"
            className="form-control"
            customInput={<Input />}
          />
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="datePerformed">
            Date Performed:
            {datePerformed && (
              <span style={{ marginLeft: '5px', color: '#666', fontSize: '0.9rem' }}>
                (Current: {format(datePerformed, 'yyyy-MM-dd')})
              </span>
            )}
          </Label>
          <ReactDatePicker
            id="datePerformed"
            selected={datePerformed}
            onChange={(date) => {
              // When a new date is selected, ensure we use the start of day to avoid timezone issues
              if (date) {
                setDatePerformed(startOfDay(date));
              } else {
                setDatePerformed(null);
              }
            }}
            dateFormat="yyyy-MM-dd"
            className="form-control"
            customInput={<Input />}
            maxDate={new Date()}
          />
        </FormGroup>

        <FormGroup>
          <Label>No setup found?</Label>
          <RadioGroup>
            <RadioLabel>
              <input
                type="radio"
                checked={noSetupFound === true}
                onChange={() => setNoSetupFound(true)}
              />
              Yes
            </RadioLabel>
            <RadioLabel>
              <input
                type="radio"
                checked={noSetupFound === false}
                onChange={() => setNoSetupFound(false)}
              />
              No
            </RadioLabel>
          </RadioGroup>
        </FormGroup>

        <FormGroup>
          <Label>Is there an obvious liq sweep?</Label>
          <RadioGroup>
            <RadioLabel>
              <input
                type="radio"
                checked={hasLiqSweep === true}
                onChange={() => setHasLiqSweep(true)}
                disabled={noSetupFound}
              />
              Yes
            </RadioLabel>
            <RadioLabel>
              <input
                type="radio"
                checked={hasLiqSweep === false}
                onChange={() => setHasLiqSweep(false)}
                disabled={noSetupFound}
              />
              No
            </RadioLabel>
          </RadioGroup>
        </FormGroup>

        <FormGroup>
          <Label htmlFor="swingFormationTime">
            When was the swing high/low formed: 
            {swingFormationTime && !noSetupFound && (
              <span style={{ marginLeft: '5px', color: '#666', fontSize: '0.9rem' }}>
                (Current: {format(swingFormationTime, 'yyyy-MM-dd HH:mm')})
              </span>
            )}
          </Label>
          <ReactDatePicker
            id="swingFormationTime"
            selected={swingFormationTime}
            onChange={handleSwingTimeChange}
            showTimeSelect
            timeFormat="HH:mm"
            timeIntervals={1}
            timeCaption="Time"
            dateFormat="yyyy-MM-dd HH:mm"
            className="form-control"
            customInput={<Input disabled={noSetupFound} />}
            disabled={noSetupFound}
            placeholderText="Select date and time"
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="obviousnessRating">Rate the obviousness of the swing (1-10):</Label>
          <Input
            id="obviousnessRating"
            type="number"
            min="1"
            max="10"
            value={obviousnessRating}
            onChange={(e) => setObviousnessRating(parseInt(e.target.value))}
            disabled={noSetupFound}
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="liqSwingType">Liquidity Swing Type:</Label>
          <Select
            id="liqSwingType"
            value={liqSwingType}
            onChange={(e) => setLiqSwingType(e.target.value)}
            disabled={noSetupFound}
          >
            <option value="PDH/PDL">PDH/PDL</option>
            <option value="Asia Low/High">Asia Low/High</option>
            <option value="Other">Other</option>
          </Select>
        </FormGroup>

        <FormGroup>
          <Label htmlFor="convincingRating">How convincing is the liq sweep (1-10):</Label>
          <Input
            id="convincingRating"
            type="number"
            min="1"
            max="10"
            value={convincingRating}
            onChange={(e) => setConvincingRating(parseInt(e.target.value))}
            disabled={noSetupFound}
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="mssTime">
            When MSS came after the sweep:
            {mssTime && !noSetupFound && (
              <span style={{ marginLeft: '5px', color: '#666', fontSize: '0.9rem' }}>
                (Current: {format(mssTime, 'yyyy-MM-dd HH:mm')})
              </span>
            )}
          </Label>
          <ReactDatePicker
            id="mssTime"
            selected={mssTime}
            onChange={handleMssTimeChange}
            showTimeSelect
            timeFormat="HH:mm"
            timeIntervals={1}
            timeCaption="Time"
            dateFormat="yyyy-MM-dd HH:mm"
            className="form-control"
            customInput={<Input disabled={noSetupFound} />}
            disabled={noSetupFound}
            placeholderText="Select date and time"
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
          />
        </FormGroup>

        <FormGroup>
          <Label>Timeframe:</Label>
          <RadioGroup>
            <RadioLabel>
              <input
                type="radio"
                checked={timeframe === '1m'}
                onChange={() => setTimeframe('1m')}
                disabled={noSetupFound}
              />
              1m
            </RadioLabel>
            <RadioLabel>
              <input
                type="radio"
                checked={timeframe === '5m'}
                onChange={() => setTimeframe('5m')}
                disabled={noSetupFound}
              />
              5m
            </RadioLabel>
          </RadioGroup>
        </FormGroup>

        <FormGroup>
          <Label>Is liq sweep formed a protected swing?</Label>
          <RadioGroup>
            <RadioLabel>
              <input
                type="radio"
                checked={isProtectedSwing === true}
                onChange={() => setIsProtectedSwing(true)}
                disabled={noSetupFound}
              />
              Yes
            </RadioLabel>
            <RadioLabel>
              <input
                type="radio"
                checked={isProtectedSwing === false}
                onChange={() => setIsProtectedSwing(false)}
                disabled={noSetupFound}
              />
              No
            </RadioLabel>
          </RadioGroup>
        </FormGroup>

        <FormGroup>
          <Label>Did price expand?</Label>
          <RadioGroup>
            <RadioLabel>
              <input
                type="radio"
                checked={didPriceExpand === true}
                onChange={() => setDidPriceExpand(true)}
                disabled={noSetupFound}
              />
              Yes
            </RadioLabel>
            <RadioLabel>
              <input
                type="radio"
                checked={didPriceExpand === false}
                onChange={() => setDidPriceExpand(false)}
                disabled={noSetupFound}
              />
              No
            </RadioLabel>
          </RadioGroup>
        </FormGroup>

        <FormGroup>
          <Label htmlFor="pipsFromSwingLow">How many pips from the new swing low:</Label>
          <Input
            id="pipsFromSwingLow"
            type="number"
            min="0"
            value={pipsFromSwingLow}
            onChange={(e) => setPipsFromSwingLow(parseInt(e.target.value))}
            disabled={noSetupFound}
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="pipsFromMSS">How many pips from the MSS:</Label>
          <Input
            id="pipsFromMSS"
            type="number"
            min="0"
            value={pipsFromMSS}
            onChange={(e) => setPipsFromMSS(parseInt(e.target.value))}
            disabled={noSetupFound}
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="chartUrl">Chart URL:</Label>
          <Input
            id="chartUrl"
            type="url"
            placeholder="https://example.com/chart"
            value={chartUrl}
            onChange={(e) => setChartUrl(e.target.value)}
          />
        </FormGroup>

        <Button type="submit">Add Backtest</Button>
        <ButtonSecondary type="button" onClick={resetForm}>
          Reset
        </ButtonSecondary>
      </form>
    </FormContainer>
  );
};

export default BacktestForm; 