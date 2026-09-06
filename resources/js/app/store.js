import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import dashboardReducer from '../features/dashboard/dashboardSlice';
import cbtReducer from '../features/cbt/cbtSlice';
import forumReducer from '../features/forum/forumSlice';
import adminUsersReducer from '../features/admin/adminUsersSlice';
import adminElearningReducer from '../features/admin/adminElearningSlice';
import adminCbtReducer from '../features/admin/adminCbtSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
    cbt: cbtReducer,
    forum: forumReducer,
    adminUsers: adminUsersReducer,
    adminElearning: adminElearningReducer,
    adminCbt: adminCbtReducer,
  },
});
