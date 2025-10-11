import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const AdminUserManagement = () => {
  const { getAdminUsers, grantSeeds } = useAuth();
  const { t, locale } = useLanguage();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }), [locale]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAdminUsers();
      setUsers(Array.isArray(response) ? response : []);
    } catch (err) {
      const messageError = err?.response?.data?.error || t('adminDashboardError');
      setError(messageError);
    } finally {
      setLoading(false);
    }
  }, [getAdminUsers, t]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    if (!filter) return users;
    const normalized = filter.trim().toLowerCase();
    return users.filter((user) =>
      [user.nombre_usuario, user.email]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(normalized))
    );
  }, [filter, users]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback(null);

    if (!selectedUserId) {
      setFeedback({ type: 'error', message: t('adminGrantSelectUser') });
      return;
    }

    const parsedAmount = Number.parseInt(amount, 10);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setFeedback({ type: 'error', message: t('economySeedTransferError') });
      return;
    }

    try {
      setSubmitting(true);
      await grantSeeds(selectedUserId, {
        cantidad: parsedAmount,
        mensaje: message || undefined,
      });
      setFeedback({ type: 'success', message: t('adminGrantSuccess') });
      setAmount('');
      setMessage('');
      await loadUsers();
    } catch (err) {
      const responseMessage = err?.response?.data?.error || t('adminGrantError');
      setFeedback({ type: 'error', message: responseMessage });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-slate-900">{t('adminManageTitle')}</h2>
        <p className="text-sm text-slate-600">{t('adminManageSubtitle')}</p>
      </header>

      <section className="rounded-2xl bg-white/70 p-5 shadow-sm ring-1 ring-white/60">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <label className="flex flex-1 flex-col gap-2 text-sm font-medium text-slate-700">
            {t('adminManageFilterLabel')}
            <input
              className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              placeholder={t('adminManageFilterPlaceholder')}
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            />
          </label>
          <button
            type="button"
            onClick={loadUsers}
            className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-600"
          >
            {t('adminManageRefresh')}
          </button>
        </div>

        {loading ? (
          <p className="mt-6 text-sm text-slate-500">{t('adminLoading')}</p>
        ) : error ? (
          <p className="mt-6 text-sm text-red-600">{error}</p>
        ) : filteredUsers.length === 0 ? (
          <p className="mt-6 text-sm text-slate-500">{t('adminManageNoResults')}</p>
        ) : (
          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-100">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">{t('adminManageTableName')}</th>
                  <th className="px-4 py-3">{t('adminManageTableEmail')}</th>
                  <th className="px-4 py-3">{t('adminManageTableSeeds')}</th>
                  <th className="px-4 py-3">{t('adminManageTableSent')}</th>
                  <th className="px-4 py-3">{t('adminManageTableReceived')}</th>
                  <th className="px-4 py-3">{t('adminManageTableRole')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{user.nombre_usuario}</div>
                      {user.fecha_creacion ? (
                        <div className="text-xs text-slate-500">
                          {t('adminMemberSince', { date: dateFormatter.format(new Date(user.fecha_creacion)) })}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">
                        {numberFormatter.format(user.semillas || 0)} 🌱
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">
                        {numberFormatter.format(user.semillas_enviadas || 0)} 🌱
                      </div>
                      <div className="text-xs text-slate-500">
                        {t('adminManageOperations', {
                          count: numberFormatter.format(user.semillas_enviadas_operaciones || 0),
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">
                        {numberFormatter.format(user.semillas_recibidas || 0)} 🌱
                      </div>
                      <div className="text-xs text-slate-500">
                        {t('adminManageOperations', {
                          count: numberFormatter.format(user.semillas_recibidas_operaciones || 0),
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {user.rol === 'admin' ? t('adminRoleAdmin') : t('adminRoleUser')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-white/70 p-5 shadow-sm ring-1 ring-white/60">
        <h3 className="text-lg font-semibold text-slate-900">{t('adminGrantTitle')}</h3>
        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-700">
            {t('adminGrantUserLabel')}
            <select
              className="mt-1 w-full rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              value={selectedUserId}
              onChange={(event) => setSelectedUserId(event.target.value)}
            >
              <option value="">{t('adminGrantUserPlaceholder')}</option>
              {users
                .filter((user) => user.rol !== 'admin')
                .map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.nombre_usuario} · {numberFormatter.format(user.semillas || 0)} 🌱
                  </option>
                ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            {t('adminGrantAmountLabel')}
            <input
              type="number"
              min="1"
              className="mt-1 w-full rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              placeholder={t('adminGrantAmountPlaceholder')}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            {t('adminGrantMessageLabel')}
            <textarea
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              placeholder={t('adminGrantMessagePlaceholder')}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={3}
            />
          </label>

          {feedback ? (
            <p
              className={
                feedback.type === 'success'
                  ? 'text-sm text-emerald-600'
                  : 'text-sm text-red-600'
              }
            >
              {feedback.message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-300"
          >
            {submitting ? t('adminGrantProcessing') : t('adminGrantSubmit')}
          </button>
        </form>
      </section>
    </div>
  );
};

export default AdminUserManagement;
