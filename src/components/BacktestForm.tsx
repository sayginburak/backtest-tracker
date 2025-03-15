import React, { useState, useEffect } from 'react';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, setHours, setMinutes } from 'date-fns';
import { useBacktest } from '../context/BacktestContext';
import { Backtest } from '../types';
import styled from '@emotion/styled';

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
  const [backtestDate, setBacktestDate] = useState<Date | null>(new Date());
  const [datePerformed, setDatePerformed] = useState<Date | null>(new Date());
  const [hasLiqSweep, setHasLiqSweep] = useState<boolean>(false);
  const [swingFormationTime, setSwingFormationTime] = useState<Date | null>(null);
  const [obviousnessRating, setObviousnessRating] = useState<number>(5);
  const [mssTime, setMssTime] = useState<Date | null>(null);
  const [timeframe, setTimeframe] = useState<'1m' | '5m'>('5m');
  const [isProtectedSwing, setIsProtectedSwing] = useState<boolean>(false);
  const [didPriceExpand, setDidPriceExpand] = useState<boolean>(false);
  const [pipsFromSwingLow, setPipsFromSwingLow] = useState<number>(0);
  const [pipsFromMSS, setPipsFromMSS] = useState<number>(0);

  useEffect(() => {
    if (backtestDate) {
      if (swingFormationTime) {
        const newDate = new Date(backtestDate);
        newDate.setHours(swingFormationTime.getHours(), swingFormationTime.getMinutes(), 0, 0);
        setSwingFormationTime(newDate);
      } else {
        setSwingFormationTime(setHours(setMinutes(new Date(backtestDate), 0), 9));
      }

      if (mssTime) {
        const newDate = new Date(backtestDate);
        newDate.setHours(mssTime.getHours(), mssTime.getMinutes(), 0, 0);
        setMssTime(newDate);
      } else {
        setMssTime(setHours(setMinutes(new Date(backtestDate), 0), 10));
      }
    }
  }, [backtestDate]);

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

    if (!swingFormationTime) {
      alert('Please select when the swing high/low was formed');
      return;
    }

    if (!mssTime) {
      alert('Please select when MSS came after the sweep');
      return;
    }

    const newBacktest: Omit<Backtest, 'id'> = {
      backtestDate: format(backtestDate, 'yyyy-MM-dd'),
      datePerformed: format(datePerformed, 'yyyy-MM-dd'),
      hasLiqSweep,
      swingFormationTime: format(swingFormationTime, 'HH:mm'),
      obviousnessRating,
      mssTime: format(mssTime, 'HH:mm'),
      timeframe,
      isProtectedSwing,
      didPriceExpand,
      pipsFromSwingLow,
      pipsFromMSS
    };

    addBacktest(newBacktest);
    resetForm();
  };

  const resetForm = () => {
    const now = new Date();
    setBacktestDate(now);
    setDatePerformed(now);
    setHasLiqSweep(false);
    setSwingFormationTime(setHours(setMinutes(new Date(now), 0), 9));
    setObviousnessRating(5);
    setMssTime(setHours(setMinutes(new Date(now), 0), 10));
    setTimeframe('5m');
    setIsProtectedSwing(false);
    setDidPriceExpand(false);
    setPipsFromSwingLow(0);
    setPipsFromMSS(0);
  };

  return (
    <FormContainer>
      <FormTitle>Add New Backtest</FormTitle>
      <form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="backtestDate">Backtest Date:</Label>
          <ReactDatePicker
            id="backtestDate"
            selected={backtestDate}
            onChange={(date) => setBacktestDate(date)}
            dateFormat="yyyy-MM-dd"
            className="form-control"
            customInput={<Input />}
          />
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="datePerformed">Date Performed:</Label>
          <ReactDatePicker
            id="datePerformed"
            selected={datePerformed}
            onChange={(date) => setDatePerformed(date)}
            dateFormat="yyyy-MM-dd"
            className="form-control"
            customInput={<Input />}
            maxDate={new Date()}
          />
        </FormGroup>

        <FormGroup>
          <Label>Is there an obvious liq sweep?</Label>
          <RadioGroup>
            <RadioLabel>
              <input
                type="radio"
                checked={hasLiqSweep === true}
                onChange={() => setHasLiqSweep(true)}
              />
              Yes
            </RadioLabel>
            <RadioLabel>
              <input
                type="radio"
                checked={hasLiqSweep === false}
                onChange={() => setHasLiqSweep(false)}
              />
              No
            </RadioLabel>
          </RadioGroup>
        </FormGroup>

        <FormGroup>
          <Label htmlFor="swingFormationTime">When was the swing high/low formed:</Label>
          <ReactDatePicker
            id="swingFormationTime"
            selected={swingFormationTime}
            onChange={(date) => setSwingFormationTime(date)}
            showTimeSelect
            timeFormat="HH:mm"
            timeIntervals={1}
            timeCaption="Time"
            dateFormat="yyyy-MM-dd HH:mm"
            className="form-control"
            customInput={<Input />}
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
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="mssTime">When MSS came after the sweep:</Label>
          <ReactDatePicker
            id="mssTime"
            selected={mssTime}
            onChange={(date) => setMssTime(date)}
            showTimeSelect
            showTimeSelectOnly
            timeIntervals={1}
            timeCaption="Time"
            dateFormat="HH:mm"
            className="form-control"
            customInput={<Input />}
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
              />
              1m
            </RadioLabel>
            <RadioLabel>
              <input
                type="radio"
                checked={timeframe === '5m'}
                onChange={() => setTimeframe('5m')}
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
              />
              Yes
            </RadioLabel>
            <RadioLabel>
              <input
                type="radio"
                checked={isProtectedSwing === false}
                onChange={() => setIsProtectedSwing(false)}
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
              />
              Yes
            </RadioLabel>
            <RadioLabel>
              <input
                type="radio"
                checked={didPriceExpand === false}
                onChange={() => setDidPriceExpand(false)}
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