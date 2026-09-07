import { Preferences } from '@capacitor/preferences';

export const setAuthUser = async ({ token, userId, role, adminName }) => {
  if (typeof localStorage !== 'undefined') {
    if (token) localStorage.setItem('token', token);
    if (userId) localStorage.setItem('userId', userId);
    if (role) localStorage.setItem('role', role);
    if (adminName) localStorage.setItem('adminName', adminName);
  }
  try {
    if (token) await Preferences.set({ key: 'token', value: token });
    if (userId) await Preferences.set({ key: 'userId', value: userId });
    if (role) await Preferences.set({ key: 'role', value: role });
    if (adminName) await Preferences.set({ key: 'adminName', value: adminName });
  } catch (e) {
    console.warn('Preferences.set failed:', e);
  }
};

export const getAuthToken = async () => {
  let token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  if (!token) {
    try {
      const res = await Preferences.get({ key: 'token' });
      token = res.value;
      if (token && typeof localStorage !== 'undefined') {
        localStorage.setItem('token', token);
      }
    } catch (e) {
      console.warn('Preferences.get token failed:', e);
    }
  }
  return token || '';
};

export const getAuthUser = async () => {
  const token = await getAuthToken();
  let userId = typeof localStorage !== 'undefined' ? localStorage.getItem('userId') : null;
  let role = typeof localStorage !== 'undefined' ? localStorage.getItem('role') : null;

  if (!userId || !role) {
    try {
      const uRes = await Preferences.get({ key: 'userId' });
      const rRes = await Preferences.get({ key: 'role' });
      if (uRes.value) {
        userId = uRes.value;
        if (typeof localStorage !== 'undefined') localStorage.setItem('userId', userId);
      }
      if (rRes.value) {
        role = rRes.value;
        if (typeof localStorage !== 'undefined') localStorage.setItem('role', role);
      }
    } catch (e) {
      console.warn('Preferences.get user data failed:', e);
    }
  }

  return { token: token || '', userId: userId || '', role: role || '' };
};

export const clearAuthUser = async () => {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('role');
    localStorage.removeItem('adminName');
  }
  try {
    await Preferences.remove({ key: 'token' });
    await Preferences.remove({ key: 'userId' });
    await Preferences.remove({ key: 'role' });
    await Preferences.remove({ key: 'adminName' });
  } catch (e) {
    console.warn('Preferences.remove failed:', e);
  }
};
