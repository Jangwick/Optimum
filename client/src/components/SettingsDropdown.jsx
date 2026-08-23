import { useState } from 'react';
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/react';
import { User, KeyRound, LogOut, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { changePassword } from '../services/auth.service.js';
import { Modal } from './Modal.jsx';
import { toast } from 'sonner';

function getInitials(user) {
  if (!user) return '?';
  const f = user.firstName?.[0] ?? '';
  const l = user.lastName?.[0] ?? '';
  return (f + l).toUpperCase() || user.email?.[0]?.toUpperCase() || '?';
}

function getRoleLabel(role) {
  switch (role) {
    case 'ADMIN':
      return 'Administrator';
    case 'ENGINEER':
      return 'Field Engineer';
    case 'ACCOUNTANT':
      return 'Accountant';
    default:
      return role;
  }
}

export function SettingsDropdown() {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    phone: user?.phone ?? '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [savingPassword, setSavingPassword] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile(profileForm);
      toast.success('Profile updated successfully');
      setShowProfile(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    setSavingPassword(true);
    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password changed successfully');
      setShowPassword(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  const openProfile = () => {
    setProfileForm({
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      phone: user?.phone ?? '',
    });
    setShowProfile(true);
  };

  return (
    <>
      <Menu as="div" className="relative">
        <MenuButton className="flex items-center gap-2 p-1 rounded-full hover:bg-surface-container-low transition-colors">
          <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-body-sm font-semibold">
            {getInitials(user)}
          </div>
          <ChevronDown size={16} className="text-outline" />
        </MenuButton>

        <MenuItems className="fixed right-2 sm:absolute sm:right-0 mt-2 w-[calc(100vw-1rem)] sm:w-64 max-w-64 bg-surface border border-surface-border rounded-lg shadow-lg z-50 origin-top-right focus:outline-none">
          <div className="px-4 py-3 border-b border-surface-border">
            <p className="text-body-md font-semibold text-on-surface truncate">
              {user?.fullName || `${user?.firstName} ${user?.lastName}`}
            </p>
            <p className="text-label-md text-on-surface-variant truncate">{user?.email}</p>
            <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-label-md font-medium">
              {getRoleLabel(user?.role)}
            </span>
          </div>

          <MenuItem>
            {({ focus }) => (
              <button
                onClick={openProfile}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-body-sm text-left ${
                  focus ? 'bg-surface-container-low' : ''
                }`}
              >
                <User size={18} className="text-primary shrink-0" />
                <span className="font-medium text-on-surface">My Profile</span>
              </button>
            )}
          </MenuItem>

          <MenuItem>
            {({ focus }) => (
              <button
                onClick={() => setShowPassword(true)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-body-sm text-left ${
                  focus ? 'bg-surface-container-low' : ''
                }`}
              >
                <KeyRound size={18} className="text-primary shrink-0" />
                <span className="font-medium text-on-surface">Change Password</span>
              </button>
            )}
          </MenuItem>

          <MenuItem>
            {({ focus }) => (
              <button
                onClick={handleLogout}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-body-sm text-left ${
                  focus ? 'bg-error/5' : ''
                }`}
              >
                <LogOut size={18} className="text-error shrink-0" />
                <span className="font-medium text-error">Sign Out</span>
              </button>
            )}
          </MenuItem>
        </MenuItems>
      </Menu>

      <Modal open={showProfile} onClose={() => setShowProfile(false)} title="My Profile" size="sm">
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-body-sm font-semibold text-on-surface mb-1.5">Email</label>
            <input
              type="email"
              value={user?.email ?? ''}
              disabled
              className="w-full h-10 px-3 rounded border border-outline bg-surface-container-low text-body-md text-on-surface-variant cursor-not-allowed"
            />
            <p className="text-label-md text-outline mt-1">Email cannot be changed</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-body-sm font-semibold text-on-surface mb-1.5">First Name</label>
              <input
                type="text"
                value={profileForm.firstName}
                onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="block text-body-sm font-semibold text-on-surface mb-1.5">Last Name</label>
              <input
                type="text"
                value={profileForm.lastName}
                onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-body-sm font-semibold text-on-surface mb-1.5">Phone</label>
            <input
              type="tel"
              value={profileForm.phone ?? ''}
              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="+63 9XX XXX XXXX"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowProfile(false)}
              className="px-4 py-2 rounded border border-outline text-body-md font-medium hover:bg-surface-container-low transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingProfile}
              className="px-4 py-2 rounded bg-primary text-on-primary text-body-md font-medium hover:bg-primary-container transition-colors disabled:opacity-50"
            >
              {savingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={showPassword} onClose={() => setShowPassword(false)} title="Change Password" size="sm">
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-body-sm font-semibold text-on-surface mb-1.5">Current Password</label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              autoComplete="current-password"
              required
            />
          </div>
          <div>
            <label className="block text-body-sm font-semibold text-on-surface mb-1.5">New Password</label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              autoComplete="new-password"
              required
              minLength={8}
            />
            <p className="text-label-md text-outline mt-1">Minimum 8 characters</p>
          </div>
          <div>
            <label className="block text-body-sm font-semibold text-on-surface mb-1.5">Confirm New Password</label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              autoComplete="new-password"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowPassword(false)}
              className="px-4 py-2 rounded border border-outline text-body-md font-medium hover:bg-surface-container-low transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingPassword}
              className="px-4 py-2 rounded bg-primary text-on-primary text-body-md font-medium hover:bg-primary-container transition-colors disabled:opacity-50"
            >
              {savingPassword ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
