import { login, setAuthCookie, clearAuthCookie } from '../services/auth.service.js';

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
