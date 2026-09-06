import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchAdminCourses = createAsyncThunk(
  'adminElearning/fetchCourses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/elearning/courses');
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const createAdminCourse = createAsyncThunk(
  'adminElearning/createCourse',
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.post('/admin/elearning/courses', data);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const updateAdminCourse = createAsyncThunk(
  'adminElearning/updateCourse',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/elearning/courses/${id}`, data);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const deleteAdminCourse = createAsyncThunk(
  'adminElearning/deleteCourse',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/admin/elearning/courses/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const adminElearningSlice = createSlice({
  name: 'adminElearning',
  initialState: {
    courses: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminCourses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminCourses.fulfilled, (state, action) => {
        state.loading = false;
        state.courses = action.payload;
      })
      .addCase(fetchAdminCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      .addCase(createAdminCourse.fulfilled, (state, action) => {
        state.courses.push(action.payload);
      })
      .addCase(updateAdminCourse.fulfilled, (state, action) => {
        const index = state.courses.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.courses[index] = action.payload;
        }
      })
      .addCase(deleteAdminCourse.fulfilled, (state, action) => {
        state.courses = state.courses.filter(c => c.id !== action.payload);
      });
  },
});

export default adminElearningSlice.reducer;
