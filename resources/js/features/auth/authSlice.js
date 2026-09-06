import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../services/api';

// Persist token to localStorage
const TOKEN_KEY = 'skorpluss_token';

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', credentials);
    localStorage.setItem(TOKEN_KEY, data.token);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message ?? 'Login gagal.');
  }
});

export const register = createAsyncThunk('auth/register', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/register', payload);
    localStorage.setItem(TOKEN_KEY, data.token);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data ?? 'Registrasi gagal.');
  }
});

export const fetchMe = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/auth/me');
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data);
  }
});

export const logoutUser = createAsyncThunk('auth/logout', async (_, { dispatch }) => {
  try { await api.post('/auth/logout'); } catch (_) { /* ignore */ }
  localStorage.removeItem(TOKEN_KEY);
  dispatch(logout());
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: localStorage.getItem(TOKEN_KEY) || null,
    loading: false,
    error: null,
    isLocked: false,
  },
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.isLocked = false;
      localStorage.removeItem(TOKEN_KEY);
    },
    setToken(state, action) {
      state.token = action.payload;
      localStorage.setItem(TOKEN_KEY, action.payload);
    },
    clearError(state) { state.error = null; },
    lockScreen(state) { state.isLocked = true; },
    unlockScreen(state) { state.isLocked = false; },
  },
  extraReducers: (builder) => {
    const pending = (state) => { state.loading = true; state.error = null; };
    const fulfilled = (state, action) => {
      state.loading = false;
      state.user = action.payload.user;
      state.token = action.payload.token ?? state.token;
    };
    const rejected = (state, action) => {
      state.loading = false;
      state.error = action.payload;
    };

    builder
      .addCase(login.pending, pending).addCase(login.fulfilled, fulfilled).addCase(login.rejected, rejected)
      .addCase(register.pending, pending).addCase(register.fulfilled, fulfilled).addCase(register.rejected, rejected)
      .addCase(fetchMe.pending, (state) => { state.loading = true; })
      .addCase(fetchMe.fulfilled, (state, action) => { state.loading = false; state.user = action.payload.user; })
      .addCase(fetchMe.rejected, (state) => { state.loading = false; });
  },
});

export const { logout, setToken, clearError, lockScreen, unlockScreen } = authSlice.actions;
export default authSlice.reducer;
