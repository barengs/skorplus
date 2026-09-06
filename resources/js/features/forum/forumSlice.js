import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchPosts = createAsyncThunk('forum/fetchPosts', async (params = {}, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/forum/posts', { params });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message ?? 'Gagal memuat forum.');
  }
});

export const createPost = createAsyncThunk('forum/createPost', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/forum/posts', payload);
    return data.post;
  } catch (err) {
    return rejectWithValue(err.response?.data ?? 'Gagal membuat pertanyaan.');
  }
});

export const replyPost = createAsyncThunk('forum/reply', async ({ postId, content }, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/forum/posts/${postId}/reply`, { content });
    return { postId, reply: data.reply };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message ?? 'Gagal mengirim balasan.');
  }
});

const forumSlice = createSlice({
  name: 'forum',
  initialState: {
    posts: [],
    pagination: null,
    loading: false,
    submitting: false,
    error: null,
  },
  reducers: {
    clearError(state) { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPosts.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.loading = false;
        state.posts = action.payload.data;
        state.pagination = { ...action.payload, data: undefined };
      })
      .addCase(fetchPosts.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createPost.pending, (state) => { state.submitting = true; })
      .addCase(createPost.fulfilled, (state, action) => {
        state.submitting = false;
        state.posts.unshift(action.payload);
      })
      .addCase(createPost.rejected, (state, action) => { state.submitting = false; state.error = action.payload; });
  },
});

export const { clearError } = forumSlice.actions;
export default forumSlice.reducer;
