import React, { useState, useEffect } from 'react';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, parseISO, startOfDay } from 'date-fns';
import styled from '@emotion/styled';
import { Analysis } from '../types';

interface AnalysisFormProps {
  onSubmit: (analysis: Omit<Analysis, 'id'>) => void;
  initialValues?: Analysis;
  onCancel?: () => void;
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

const ErrorMessage = styled.div`
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 5px;
`;

const AnalysisForm: React.FC<AnalysisFormProps> = ({ onSubmit, initialValues, onCancel }) => {
  // Form state
  const [backtestDate, setBacktestDate] = useState<Date | null>(new Date());
  const [datePerformed, setDatePerformed] = useState<Date | null>(new Date());
  const [resultType, setResultType] = useState<'a' | 'b' | 'c' | 'd' | 'e'>('a');
  const [notionUrl, setNotionUrl] = useState<string>('');
  
  // Validation state
  const [errors, setErrors] = useState({
    backtestDate: '',
    datePerformed: '',
    resultType: '',
    notionUrl: ''
  });

  // Initialize form with initial values if provided
  useEffect(() => {
    if (initialValues) {
      // Parse dates safely
      if (initialValues.backtestDate) {
        setBacktestDate(startOfDay(parseISO(initialValues.backtestDate)));
      }
      
      if (initialValues.datePerformed) {
        setDatePerformed(startOfDay(parseISO(initialValues.datePerformed)));
      }
      
      setResultType(initialValues.resultType);
      setNotionUrl(initialValues.notionUrl || '');
    }
  }, [initialValues]);

  // Validate form fields
  const validateForm = (): boolean => {
    const newErrors = {
      backtestDate: '',
      datePerformed: '',
      resultType: '',
      notionUrl: ''
    };
    
    let isValid = true;
    
    if (!backtestDate) {
      newErrors.backtestDate = 'Backtest date is required';
      isValid = false;
    }
    
    if (!datePerformed) {
      newErrors.datePerformed = 'Date performed is required';
      isValid = false;
    }
    
    if (!resultType) {
      newErrors.resultType = 'Result type is required';
      isValid = false;
    }
    
    if (!notionUrl) {
      newErrors.notionUrl = 'Notion URL is required';
      isValid = false;
    } else if (!notionUrl.startsWith('https://')) {
      newErrors.notionUrl = 'Please enter a valid URL starting with https://';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      const formattedBacktestDate = format(backtestDate!, 'yyyy-MM-dd');
      const formattedDatePerformed = format(datePerformed!, 'yyyy-MM-dd');
      
      onSubmit({
        backtestDate: formattedBacktestDate,
        datePerformed: formattedDatePerformed,
        resultType,
        notionUrl
      });
      
      // Reset form
      setBacktestDate(new Date());
      setDatePerformed(new Date());
      setResultType('a');
      setNotionUrl('');
    }
  };

  return (
    <FormContainer>
      <FormTitle>Add Analysis</FormTitle>
      <form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="backtestDate">Backtest Date</Label>
          <ReactDatePicker
            id="backtestDate"
            selected={backtestDate}
            onChange={(date: Date | null) => setBacktestDate(date)}
            dateFormat="yyyy-MM-dd"
            className={`form-control ${errors.backtestDate ? 'is-invalid' : ''}`}
            customInput={<Input />}
          />
          {errors.backtestDate && <ErrorMessage>{errors.backtestDate}</ErrorMessage>}
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="datePerformed">Date Performed</Label>
          <ReactDatePicker
            id="datePerformed"
            selected={datePerformed}
            onChange={(date: Date | null) => setDatePerformed(date)}
            dateFormat="yyyy-MM-dd"
            className={`form-control ${errors.datePerformed ? 'is-invalid' : ''}`}
            customInput={<Input />}
          />
          {errors.datePerformed && <ErrorMessage>{errors.datePerformed}</ErrorMessage>}
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="resultType">Result Type</Label>
          <Select
            id="resultType"
            value={resultType}
            onChange={(e) => setResultType(e.target.value as 'a' | 'b' | 'c' | 'd' | 'e')}
            className={errors.resultType ? 'is-invalid' : ''}
          >
            <option value="a">A</option>
            <option value="b">B</option>
            <option value="c">C</option>
            <option value="d">D</option>
            <option value="e">E</option>
          </Select>
          {errors.resultType && <ErrorMessage>{errors.resultType}</ErrorMessage>}
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="notionUrl">Notion URL</Label>
          <Input
            id="notionUrl"
            type="url"
            value={notionUrl}
            onChange={(e) => setNotionUrl(e.target.value)}
            placeholder="https://notion.so/..."
            className={errors.notionUrl ? 'is-invalid' : ''}
          />
          {errors.notionUrl && <ErrorMessage>{errors.notionUrl}</ErrorMessage>}
        </FormGroup>
        
        <div>
          <Button type="submit">Submit</Button>
          {onCancel && (
            <ButtonSecondary type="button" onClick={onCancel}>
              Cancel
            </ButtonSecondary>
          )}
        </div>
      </form>
    </FormContainer>
  );
};

export default AnalysisForm;