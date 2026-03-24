export type ActionType = 
  | 'setState' 
  | 'toggleState' 
  | 'rest' 
  | 'navigation' 
  | 'sequence' 
  | 'conditional' 
  | 'ui';

export interface SetStateAction {
  type: 'setState';
  payload: {
    key: string;
    value: any;
  };
}

export interface ToggleStateAction {
  type: 'toggleState';
  payload: {
    key: string;
  };
}

export interface RestAction {
  type: 'rest';
  payload: {
    url: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    body?: Record<string, any>;
    onSuccess?: Action[];
    onError?: Action[];
    stateKey?: string; // Where to store the response
  };
}

export interface NavigationAction {
  type: 'navigation';
  payload: {
    to: string; // Internal step ID or external URL
    type: 'step' | 'external';
    replace?: boolean;
  };
}

export interface SequenceAction {
  type: 'sequence';
  payload: {
    actions: Action[];
  };
}

export interface ConditionalAction {
  type: 'conditional';
  payload: {
    condition: string; // Expression or state key
    onTrue: Action[];
    onFalse?: Action[];
  };
}

export interface UIAction {
  type: 'ui';
  payload: {
    operation: 'scrollTo' | 'copyToClipboard' | 'openPopup' | 'closePopup' | 'goToNextStep';
    params?: Record<string, any>;
  };
}

export type Action = 
  | SetStateAction 
  | ToggleStateAction 
  | RestAction 
  | NavigationAction 
  | SequenceAction 
  | ConditionalAction 
  | UIAction;
