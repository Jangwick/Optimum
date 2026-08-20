import { login, setAuthCookie, clearAuthCookie, changePassword, updateProfile } from '../services/auth.service.js';

export async function loginHandler(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const { token, user } = await login(email, password);
    setAuthCookie(res, token);

    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
}

export function logoutHandler(req, res) {
  clearAuthCookie(res);
  res.json({ success: true });
}

export function meHandler(req, res) {
  res.json({ success: true, user: req.user });
}

export async function changePasswordHandler(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Current and new passwords are required' });
    }
    await changePassword(req.user.id, currentPassword, newPassword);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function updateProfileHandler(req, res, next) {
  try {
    const user = await updateProfile(req.user.id, req.body);
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
}
