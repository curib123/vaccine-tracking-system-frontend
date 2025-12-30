'use client';

import {
  useEffect,
  useState,
} from 'react';

import { useRouter } from 'next/navigation';

import api from '@/lib/api';

/* ================= TYPES ================= */
type Role = {
  id: number;
  name: string;
};

type UserForm = {
  email: string;
  password?: string;
  firstName: string;
  middleName: string;
  lastName: string;
  contactNo: string;
  address: string;
  roleId: number;
};

type Props = {
  open: boolean;
  userId?: number | null;
  onClose: () => void;
  onSaved: () => void;
};

/* ================= INITIAL FORM ================= */
const initialForm: UserForm = {
  email: '',
  password: '',
  firstName: '',
  middleName: '',
  lastName: '',
  contactNo: '',
  address: '',
  roleId: 0,
};

/* ================= COMPONENT ================= */
export default function UpsertUserModal({
  open,
  userId,
  onClose,
  onSaved,
}: Props) {
  const router = useRouter();
  const isEdit = Boolean(userId);

  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<UserForm>(initialForm);

  /* ================= HELPERS ================= */
  const resetForm = () => setForm(initialForm);

  const close = () => {
    resetForm();
    onClose();
  };

  const handleAuthError = (err: any) => {
    if (err?.response?.status === 401) {
      sessionStorage.clear();
      router.replace('/login');
    }
  };

  /* ================= LOAD ROLES ================= */
  useEffect(() => {
    if (!open) return;

    const loadRoles = async () => {
      try {
        const { data } = await api.get('/roles/getAllRoles');
        setRoles(data.data || []);

        if (!isEdit && data.data?.length) {
          setForm(f => ({ ...f, roleId: data.data[0].id }));
        }
      } catch (err) {
        handleAuthError(err);
        console.error('loadRoles error:', err);
      }
    };

    loadRoles();
  }, [open, isEdit]);

  /* ================= LOAD USER (EDIT) ================= */
  useEffect(() => {
    if (!open || !isEdit || !userId) return;

    const loadUser = async () => {
      try {
        setLoading(true);

        const { data } = await api.get(`/user/getUserById/${userId}`);

        setForm({
          email: data.data.email,
          firstName: data.data.firstName,
          middleName: data.data.middleName || '',
          lastName: data.data.lastName,
          contactNo: data.data.contactNo,
          address: data.data.address,
          roleId: data.data.roleId,
        });
      } catch (err) {
        handleAuthError(err);
        console.error('loadUser error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [open, isEdit, userId]);

  /* ================= RESET ON CREATE ================= */
  useEffect(() => {
    if (open && !isEdit) resetForm();
  }, [open, isEdit]);

  /* ================= HANDLERS ================= */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const submit = async () => {
    try {
      setLoading(true);

      if (isEdit) {
        await api.put(`/user/updateUserById/${userId}`, form);
      } else {
        await api.post('/auth/registerUser', form);
      }

      resetForm();
      onSaved();
      onClose();
    } catch (err) {
      handleAuthError(err);
      console.error('submit error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  /* ================= UI ================= */
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={close}
      />

      {/* Modal */}
      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              {isEdit ? 'Edit User' : 'Create User'}
            </h2>
            <p className="text-sm text-slate-500">
              {isEdit
                ? 'Update user account information'
                : 'Add a new user to the system'}
            </p>
          </div>
          <button
            onClick={close}
            className="text-slate-400 hover:text-slate-600 text-lg"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 grid grid-cols-2 gap-4">
          <Input label="First Name" name="firstName" value={form.firstName} onChange={handleChange} />
          <Input label="Middle Name" name="middleName" value={form.middleName} onChange={handleChange} />
          <Input label="Last Name" name="lastName" value={form.lastName} onChange={handleChange} />
          <Input label="Contact No" name="contactNo" value={form.contactNo} onChange={handleChange} />

          <div className="col-span-2">
            <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} />
          </div>

          {!isEdit && (
            <div className="col-span-2">
              <Input
                label="Password"
                name="password"
                type="password"
                value={form.password || ''}
                onChange={handleChange}
              />
            </div>
          )}

          <div className="col-span-2">
            <Input label="Address" name="address" value={form.address} onChange={handleChange} />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Role
            </label>
            <select
              name="roleId"
              value={form.roleId}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
            >
              {roles.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-slate-50 flex justify-end gap-3">
          <button
            onClick={close}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-slate-600"
          >
            Cancel
          </button>

          <button
            onClick={submit}
            disabled={loading}
            className="px-5 py-2 rounded-lg bg-blue-600 text-white"
          >
            {loading ? 'Saving...' : isEdit ? 'Update User' : 'Create User'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= INPUT ================= */
function Input(
  props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }
) {
  const { label, ...inputProps } = props;

  return (
    <div>
      <label className="block text-sm font-medium text-slate-600 mb-1">
        {label}
      </label>
      <input
        {...inputProps}
        className="w-full px-3 py-2 rounded-lg border border-slate-300"
      />
    </div>
  );
}
