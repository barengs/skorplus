import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchAvailableExams = createAsyncThunk('cbt/fetchAvailableExams', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/cbt/available-exams');
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const fetchExamTypes = createAsyncThunk('cbt/fetchExamTypes', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/cbt/exam-types');
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const startSession = createAsyncThunk('cbt/start', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/cbt/sessions', payload);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: 'Gagal memulai sesi.' });
  }
});

export const saveAnswer = createAsyncThunk('cbt/saveAnswer', async ({ sessionId, ...body }, { rejectWithValue }) => {
  try {
    await api.post(`/cbt/sessions/${sessionId}/answer`, body);
    return body;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const submitSession = createAsyncThunk('cbt/submit', async (sessionId, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/cbt/sessions/${sessionId}/submit`);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message ?? 'Gagal submit ujian.');
  }
});

export const cancelSession = createAsyncThunk('cbt/cancel', async (sessionId, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/cbt/sessions/${sessionId}/cancel`);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message ?? 'Gagal membatalkan sesi ujian.');
  }
});

export const fetchSessions = createAsyncThunk('cbt/fetchSessions', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/cbt/sessions');
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

const cbtSlice = createSlice({
  name: 'cbt',
  initialState: {
    availableExams: [],
    examTypes: [],
    sessions: [],
    currentSession: null,
    questions: [],
    answers: {}, // { questionNumber: { selected_option, is_flagged } }
    currentQuestion: 1,
    loading: false,
    submitting: false,
    result: null,
    error: null,
    quotaInfo: null,
  },
  reducers: {
    setCurrentQuestion(state, action) { state.currentQuestion = action.payload; },
    setLocalAnswer(state, action) {
      const { question_number, selected_option, is_flagged } = action.payload;
      state.answers[question_number] = { selected_option, is_flagged: is_flagged ?? state.answers[question_number]?.is_flagged ?? false };
    },
    toggleFlag(state, action) {
      const n = action.payload;
      if (state.answers[n]) state.answers[n].is_flagged = !state.answers[n].is_flagged;
      else state.answers[n] = { selected_option: null, is_flagged: true };
    },
    clearSession(state) {
      state.currentSession = null; state.questions = []; state.answers = {}; state.currentQuestion = 1; state.result = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAvailableExams.fulfilled, (state, action) => {
        state.availableExams = action.payload.exams || [];
        if (action.payload.exam_types) {
          state.examTypes = action.payload.exam_types;
        }
        state.quotaInfo = action.payload.quota_info || null;
      })
      .addCase(fetchExamTypes.fulfilled, (state, action) => {
        state.examTypes = action.payload || [];
      })
      .addCase(startSession.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(startSession.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSession = action.payload.session;
        state.questions = action.payload.questions;
        state.answers = {};
        state.currentQuestion = 1;
      })
      .addCase(startSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || (typeof action.payload === 'string' ? action.payload : 'Gagal memulai sesi.');
        if (action.payload?.quota_info) {
          state.quotaInfo = action.payload.quota_info;
        }
      })
      .addCase(submitSession.pending, (state) => { state.submitting = true; })
      .addCase(submitSession.fulfilled, (state, action) => { state.submitting = false; state.result = action.payload; })
      .addCase(submitSession.rejected, (state, action) => { state.submitting = false; state.error = action.payload; })
      .addCase(cancelSession.pending, (state) => { state.loading = true; })
      .addCase(cancelSession.fulfilled, (state) => {
        state.loading = false;
        state.currentSession = null;
        state.questions = [];
        state.answers = {};
        state.currentQuestion = 1;
        state.result = null;
      })
      .addCase(cancelSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchSessions.fulfilled, (state, action) => { state.sessions = action.payload.sessions; });
  },
});

export const { setCurrentQuestion, setLocalAnswer, toggleFlag, clearSession } = cbtSlice.actions;
export default cbtSlice.reducer;
