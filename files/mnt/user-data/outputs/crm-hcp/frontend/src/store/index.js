import { configureStore, createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// ─── Async Thunks ─────────────────────────────────────────────────────────────
export const fetchHCPs = createAsyncThunk('hcps/fetchAll', async () => {
  const res = await axios.get(`${API}/api/hcps`);
  return res.data;
});

export const fetchInteractions = createAsyncThunk('interactions/fetchAll', async () => {
  const res = await axios.get(`${API}/api/interactions`);
  return res.data;
});

export const createInteraction = createAsyncThunk('interactions/create', async (data) => {
  const res = await axios.post(`${API}/api/interactions`, data);
  return res.data;
});

export const updateInteraction = createAsyncThunk('interactions/update', async ({ id, field, new_value }) => {
  const res = await axios.patch(`${API}/api/interactions/${id}`, { field, new_value });
  return { id, field, new_value, ...res.data };
});

export const analyzeInteraction = createAsyncThunk('interactions/analyze', async (id) => {
  const res = await axios.post(`${API}/api/interactions/${id}/analyze`);
  return { id, ...res.data };
});

export const fetchDashboard = createAsyncThunk('dashboard/fetch', async () => {
  const res = await axios.get(`${API}/api/dashboard`);
  return res.data;
});

export const sendChatMessage = createAsyncThunk('chat/send', async ({ message, history }) => {
  const res = await axios.post(`${API}/api/chat`, { message, history });
  return res.data;
});

export const fetchFollowUps = createAsyncThunk('followups/fetchAll', async () => {
  const res = await axios.get(`${API}/api/followups`);
  return res.data;
});

export const createFollowUp = createAsyncThunk('followups/create', async (data) => {
  const res = await axios.post(`${API}/api/followups`, data);
  return res.data;
});

// ─── Slices ───────────────────────────────────────────────────────────────────
const hcpSlice = createSlice({
  name: 'hcps',
  initialState: { list: [], loading: false },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchHCPs.pending, (s) => { s.loading = true; });
    b.addCase(fetchHCPs.fulfilled, (s, a) => { s.list = a.payload; s.loading = false; });
    b.addCase(fetchHCPs.rejected, (s) => { s.loading = false; });
  }
});

const interactionsSlice = createSlice({
  name: 'interactions',
  initialState: { list: [], loading: false, lastCreated: null },
  reducers: {
    clearLastCreated: (s) => { s.lastCreated = null; }
  },
  extraReducers: (b) => {
    b.addCase(fetchInteractions.pending, (s) => { s.loading = true; });
    b.addCase(fetchInteractions.fulfilled, (s, a) => { s.list = a.payload; s.loading = false; });
    b.addCase(createInteraction.fulfilled, (s, a) => {
      s.lastCreated = a.payload;
    });
    b.addCase(analyzeInteraction.fulfilled, (s, a) => {
      const idx = s.list.findIndex(i => i.id === a.payload.id);
      if (idx !== -1) {
        s.list[idx].sentiment = a.payload.overall_sentiment;
        s.list[idx].engagement_score = a.payload.engagement_score;
      }
    });
  }
});

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: { data: null, loading: false },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchDashboard.pending, (s) => { s.loading = true; });
    b.addCase(fetchDashboard.fulfilled, (s, a) => { s.data = a.payload; s.loading = false; });
  }
});

const chatSlice = createSlice({
  name: 'chat',
  initialState: { messages: [], loading: false },
  reducers: {
    addUserMessage: (s, a) => {
      s.messages.push({ role: 'user', content: a.payload, ts: Date.now() });
    },
    clearChat: (s) => { s.messages = []; }
  },
  extraReducers: (b) => {
    b.addCase(sendChatMessage.pending, (s) => { s.loading = true; });
    b.addCase(sendChatMessage.fulfilled, (s, a) => {
      s.messages.push({ role: 'assistant', content: a.payload.response, tool_calls: a.payload.tool_calls, ts: Date.now() });
      s.loading = false;
    });
    b.addCase(sendChatMessage.rejected, (s) => { s.loading = false; });
  }
});

const followupsSlice = createSlice({
  name: 'followups',
  initialState: { list: [], loading: false },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchFollowUps.fulfilled, (s, a) => { s.list = a.payload; });
    b.addCase(createFollowUp.fulfilled, (s, a) => { s.list.unshift(a.payload); });
  }
});

export const { addUserMessage, clearChat } = chatSlice.actions;
export const { clearLastCreated } = interactionsSlice.actions;

export default configureStore({
  reducer: {
    hcps: hcpSlice.reducer,
    interactions: interactionsSlice.reducer,
    dashboard: dashboardSlice.reducer,
    chat: chatSlice.reducer,
    followups: followupsSlice.reducer,
  }
});
