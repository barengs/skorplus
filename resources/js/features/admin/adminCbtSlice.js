import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchAdminExams = createAsyncThunk(
  'adminCbt/fetchExams',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/cbt/exams');
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const createAdminExam = createAsyncThunk(
  'adminCbt/createExam',
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.post('/admin/cbt/exams', data);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const updateAdminExam = createAsyncThunk(
  'adminCbt/updateExam',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/cbt/exams/${id}`, data);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const deleteAdminExam = createAsyncThunk(
  'adminCbt/deleteExam',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/admin/cbt/exams/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const adminCbtSlice = createSlice({
  name: 'adminCbt',
  initialState: {
    exams: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminExams.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminExams.fulfilled, (state, action) => {
        state.loading = false;
        state.exams = action.payload;
      })
      .addCase(fetchAdminExams.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(createAdminExam.fulfilled, (state, action) => {
        state.exams.unshift(action.payload);
      })
      .addCase(updateAdminExam.fulfilled, (state, action) => {
        const index = state.exams.findIndex(e => e.id === action.payload.id);
        if (index !== -1) {
          state.exams[index] = action.payload;
        }
      })
      .addCase(deleteAdminExam.fulfilled, (state, action) => {
        state.exams = state.exams.filter(e => e.id !== action.payload);
      });
  },
});

export default adminCbtSlice.reducer;
