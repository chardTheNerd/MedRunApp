import React, { createContext, useCallback, useContext, useMemo, useReducer } from 'react';
import { container } from '../../di/container';
import { Consultation, ConsultationMessage } from '../../domain/entities/Consultation';
import { RequestConsultationInput } from '../../domain/repositories/ConsultationRepository';

type ConsultationState = {
  consultations: Consultation[];
  messages: ConsultationMessage[];
  loading: boolean;
  error: string | null;
};

type ConsultationEvent =
  | { type: 'loading' }
  | { type: 'loaded'; consultations: Consultation[] }
  | { type: 'created'; consultation: Consultation }
  | { type: 'messagesLoaded'; messages: ConsultationMessage[] }
  | { type: 'messageSent'; message: ConsultationMessage }
  | { type: 'failed'; message: string };

function consultationReducer(state: ConsultationState, event: ConsultationEvent): ConsultationState {
  switch (event.type) {
    case 'loading':
      return { ...state, loading: true, error: null };
    case 'loaded':
      return { ...state, loading: false, consultations: event.consultations };
    case 'created':
      return {
        ...state,
        loading: false,
        consultations: [event.consultation, ...state.consultations],
      };
    case 'messagesLoaded':
      return { ...state, loading: false, messages: event.messages };
    case 'messageSent':
      return { ...state, loading: false, messages: [...state.messages, event.message] };
    case 'failed':
      return { ...state, loading: false, error: event.message };
    default:
      return state;
  }
}

type ConsultationContextValue = ConsultationState & {
  loadPatientConsultations: (patientId: string) => Promise<void>;
  request: (input: RequestConsultationInput) => Promise<Consultation | null>;
  loadMessages: (consultationId: string) => Promise<void>;
  sendMessage: (consultationId: string, senderId: string, body: string) => Promise<boolean>;
};

const ConsultationContext = createContext<ConsultationContextValue | null>(null);

export function ConsultationProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(consultationReducer, {
    consultations: [],
    messages: [],
    loading: false,
    error: null,
  });

  const loadPatientConsultations = useCallback(async (patientId: string) => {
    dispatch({ type: 'loading' });
    const result = await container.repositories.consultations.listForPatient(patientId);
    if (!result.ok) {
      dispatch({ type: 'failed', message: result.error.message });
      return;
    }
    dispatch({ type: 'loaded', consultations: result.value });
  }, []);

  const request = useCallback(async (input: RequestConsultationInput) => {
    dispatch({ type: 'loading' });
    const result = await container.usecases.requestConsultation.execute(input);
    if (!result.ok) {
      dispatch({ type: 'failed', message: result.error.message });
      return null;
    }
    dispatch({ type: 'created', consultation: result.value });
    return result.value;
  }, []);

  const loadMessages = useCallback(async (consultationId: string) => {
    dispatch({ type: 'loading' });
    const result = await container.repositories.consultations.listMessages(consultationId);
    if (!result.ok) {
      dispatch({ type: 'failed', message: result.error.message });
      return;
    }
    dispatch({ type: 'messagesLoaded', messages: result.value });
  }, []);

  const sendMessage = useCallback(async (consultationId: string, senderId: string, body: string) => {
    if (!body.trim()) {
      return false;
    }
    const result = await container.repositories.consultations.sendMessage(
      consultationId,
      senderId,
      body.trim(),
    );
    if (!result.ok) {
      dispatch({ type: 'failed', message: result.error.message });
      return false;
    }
    dispatch({ type: 'messageSent', message: result.value });
    return true;
  }, []);

  const value = useMemo(
    () => ({ ...state, loadPatientConsultations, request, loadMessages, sendMessage }),
    [state, loadPatientConsultations, request, loadMessages, sendMessage],
  );

  return <ConsultationContext.Provider value={value}>{children}</ConsultationContext.Provider>;
}

export function useConsultations() {
  const value = useContext(ConsultationContext);
  if (!value) {
    throw new Error('useConsultations must be used inside ConsultationProvider.');
  }
  return value;
}
