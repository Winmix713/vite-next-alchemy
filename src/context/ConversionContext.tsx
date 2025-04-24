
import React, { createContext, useContext, useReducer, ReactNode, useCallback } from 'react';
import { 
  ConversionState, 
  ConversionAction, 
  ConversionContextType,
  ConversionOptions
} from '@/types/conversion';

const defaultConversionOptions: ConversionOptions = {
  useReactRouter: true,
  convertApiRoutes: true,
  transformDataFetching: true,
  replaceComponents: true,
  updateDependencies: true,
  preserveTypeScript: true,
  handleMiddleware: true
};

const initialState: ConversionState = {
  isConverting: false,
  conversionOptions: defaultConversionOptions,
  progress: 0,
  message: '',
  originalCode: '',
  convertedCode: '',
  conversionResult: null,
  conversionError: null
};

function conversionReducer(state: ConversionState, action: ConversionAction): ConversionState {
  switch (action.type) {
    case 'SET_IS_CONVERTING':
      return { ...state, isConverting: action.payload };
    
    case 'SET_CONVERSION_OPTIONS':
      return { ...state, conversionOptions: action.payload };
    
    case 'SET_CONVERSION_PROGRESS':
      return { 
        ...state, 
        progress: action.payload.progress, 
        message: action.payload.message 
      };
    
    case 'SET_PROJECT_DATA':
      return { ...state, projectData: action.payload };
    
    case 'SET_ORIGINAL_CODE':
      return { ...state, originalCode: action.payload };
    
    case 'SET_CONVERTED_CODE':
      return { ...state, convertedCode: action.payload };
    
    case 'SET_CONVERSION_RESULT':
      return { 
        ...state, 
        conversionResult: action.payload.result,
        convertedCode: action.payload.result.transformedCode,
        conversionError: null
      };
    
    case 'SET_CONVERSION_ERROR':
      return { ...state, conversionError: action.payload, isConverting: false };
    
    default:
      return state;
  }
}

const ConversionContext = createContext<ConversionContextType | undefined>(undefined);

export const ConversionProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(conversionReducer, initialState);

  const toggleOption = useCallback((option: keyof ConversionOptions) => {
    dispatch({
      type: 'SET_CONVERSION_OPTIONS',
      payload: {
        ...state.conversionOptions,
        [option]: !state.conversionOptions[option]
      }
    });
  }, [state.conversionOptions]);

  const updateOriginalCode = useCallback((code: string) => {
    dispatch({
      type: 'SET_ORIGINAL_CODE',
      payload: code
    });
  }, []);

  const updateConvertedCode = useCallback((code: string) => {
    dispatch({
      type: 'SET_CONVERTED_CODE',
      payload: code
    });
  }, []);

  return (
    <ConversionContext.Provider 
      value={{ 
        state, 
        dispatch, 
        toggleOption,
        updateOriginalCode,
        updateConvertedCode
      }}
    >
      {children}
    </ConversionContext.Provider>
  );
};

export const useConversion = () => {
  const context = useContext(ConversionContext);
  if (context === undefined) {
    throw new Error('useConversion must be used within a ConversionProvider');
  }
  return context;
};
