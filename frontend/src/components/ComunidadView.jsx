import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const ComunidadView = () => {
  const { searchUsers, addFriend, getFriends, getUserProfile } = useAuth();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);

  const [friends, setFriends] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [friendsError, setFriendsError] = useState(null);

  const [addingFriendId, setAddingFriendId] = useState(null);

  const [selectedFriendId, setSelectedFriendId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);

  const loadFriends = useCallback(async () => {
    setFriendsLoading(true);
    setFriendsError(null);
    try {
      const data = await getFriends();
      setFriends(data);
    } catch (err) {
      setFriendsError('No se pudieron cargar tus amigos.');
    } finally {
      setFriendsLoading(false);
    }
  }, [getFriends]);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  const loadProfile = useCallback(
    async (friendId) => {
      if (!friendId) return;
      setProfileLoading(true);
      setProfileError(null);
      try {
        const data = await getUserProfile(friendId);
        setProfile(data);
      } catch (err) {
        setProfile(null);
        setProfileError(err.response?.data?.error || 'No se pudo cargar el perfil seleccionado.');
      } finally {
        setProfileLoading(false);
      }
    },
    [getUserProfile]
  );

  const handleSelectFriend = useCallback(
    (friendId) => {
      setSelectedFriendId(friendId);
      loadProfile(friendId);
    },
    [loadProfile]
  );

  useEffect(() => {
    if (!friends.length) {
      setSelectedFriendId(null);
      setProfile(null);
      return;
    }

    if (!selectedFriendId || !friends.some((friend) => friend.id === selectedFriendId)) {
      handleSelectFriend(friends[0].id);
    }
  }, [friends, selectedFriendId, handleSelectFriend]);

  const handleSearch = async (event) => {
    event.preventDefault();
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 2) {
      setSearchError('Escribe al menos 2 caracteres para buscar.');
      setStatusMessage(null);
      setSearchResults([]);
      return;
    }

    setSearching(true);
    setSearchError(null);
    setStatusMessage(null);
    try {
      const results = await searchUsers(trimmedQuery);
      setSearchResults(results);
    } catch (err) {
      setSearchError('No se pudo realizar la búsqueda.');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleAddFriend = async (friendId) => {
    setAddingFriendId(friendId);
    setSearchError(null);
    setStatusMessage(null);
    try {
      const friend = await addFriend(friendId);
      setStatusMessage(
        friend?.nombre_usuario
          ? `${friend.nombre_usuario} ahora forma parte de tu jardín social.`
          : 'Se agregó el nuevo amigo correctamente.'
      );
      setSearchResults((prev) =>
        prev.map((item) => (item.id === friendId ? { ...item, es_amigo: true } : item))
      );
      await loadFriends();
      if (friend?.id) {
        handleSelectFriend(friend.id);
      }
    } catch (err) {
      setSearchError(err.response?.data?.error || 'No se pudo agregar a la persona seleccionada.');
    } finally {
      setAddingFriendId(null);
    }
  };

  const selectedFriend = useMemo(
    () => friends.find((friend) => friend.id === selectedFriendId) || null,
    [friends, selectedFriendId]
  );

  const renderEventBadge = (tipo) => {
    if (tipo === 'positivo') return 'bg-emerald-500';
    if (tipo === 'negativo') return 'bg-rose-500';
    return 'bg-slate-500';
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
      <div className="space-y-6">
        <section className="rounded-3xl bg-white p-6 shadow">
          <header className="mb-4">
            <h2 className="text-xl font-semibold text-gardenGreen">Buscar comunidad</h2>
            <p className="text-sm text-slate-600">
              Encuentra a otros jardineros emocionales por su nombre de usuario y agrégalos como amigos.
            </p>
          </header>
          <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nombre de usuario"
              className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-slate-700 focus:border-gardenGreen focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-full bg-gardenGreen px-5 py-2 font-semibold text-white shadow hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={searching}
            >
              {searching ? 'Buscando...' : 'Buscar'}
            </button>
          </form>
          {(searchError || statusMessage) && (
            <p className={`mt-3 text-sm ${searchError ? 'text-rose-600' : 'text-emerald-600'}`}>
              {searchError || statusMessage}
            </p>
          )}
          {searchResults.length > 0 && (
            <ul className="mt-4 space-y-3">
              {searchResults.map((result) => (
                <li
                  key={result.id}
                  className="flex flex-col items-start justify-between gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center"
                >
                  <div>
                    <p className="text-sm font-semibold text-gardenSoil">{result.nombre_usuario}</p>
                    {result.es_amigo && (
                      <p className="text-xs text-emerald-600">Ya es parte de tus amigos</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddFriend(result.id)}
                    disabled={result.es_amigo || addingFriendId === result.id}
                    className="rounded-full bg-emerald-500 px-4 py-1 text-sm font-semibold text-white shadow hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {result.es_amigo
                      ? 'Amigo agregado'
                      : addingFriendId === result.id
                      ? 'Agregando...'
                      : 'Agregar amigo'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-3xl bg-white p-6 shadow">
          <header className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gardenGreen">Tus amigos</h2>
              <p className="text-sm text-slate-600">Explora cómo florecen los jardines de tu comunidad.</p>
            </div>
            <button
              type="button"
              onClick={loadFriends}
              className="rounded-full border border-gardenGreen px-4 py-1 text-sm font-semibold text-gardenGreen hover:bg-emerald-50"
            >
              Actualizar
            </button>
          </header>
          {friendsLoading && <p className="text-sm text-slate-500">Cargando amigos...</p>}
          {friendsError && <p className="text-sm text-rose-600">{friendsError}</p>}
          {!friendsLoading && !friendsError && friends.length === 0 && (
            <p className="text-sm text-slate-600">
              Aún no tienes amigos registrados. Busca nuevos jardineros y comparte su crecimiento emocional.
            </p>
          )}
          <ul className="mt-4 space-y-3">
            {friends.map((friend) => {
              const health = friend.jardin?.estado_salud ?? null;
              const lastEvent = friend.jardin?.plantas_recientes?.[0] || null;
              const friendshipDate = friend.fecha_union
                ? new Date(friend.fecha_union).toLocaleDateString('es-ES', { dateStyle: 'medium' })
                : null;
              return (
                <li key={friend.id}>
                  <button
                    type="button"
                    onClick={() => handleSelectFriend(friend.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition shadow-sm ${
                      friend.id === selectedFriendId
                        ? 'border-gardenGreen bg-emerald-50/80'
                        : 'border-slate-100 bg-slate-50 hover:border-gardenGreen/60 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-base font-semibold text-gardenSoil">{friend.nombre_usuario}</p>
                      {health !== null && (
                        <span className="text-sm font-semibold text-gardenGreen">Salud: {health}%</span>
                      )}
                    </div>
                    {friendshipDate && (
                      <p className="mt-1 text-xs text-slate-500">Amistad desde {friendshipDate}</p>
                    )}
                    {lastEvent ? (
                      <p className="mt-3 text-sm text-slate-600">
                        Último evento: <strong>{lastEvent.nombre}</strong>{' '}
                        <span
                          className={`ml-2 inline-block rounded-full px-3 py-0.5 text-xs font-semibold uppercase tracking-wide text-white ${renderEventBadge(
                            lastEvent.tipo
                          )}`}
                        >
                          {lastEvent.tipo}
                        </span>
                      </p>
                    ) : (
                      <p className="mt-3 text-sm text-slate-500">Aún no hay eventos registrados.</p>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <section className="rounded-3xl bg-white p-6 shadow">
        <header className="mb-4">
          <h2 className="text-xl font-semibold text-gardenGreen">
            {selectedFriend ? `Jardín de ${selectedFriend.nombre_usuario}` : 'Selecciona un amigo'}
          </h2>
          {selectedFriend && (
            <p className="text-sm text-slate-600">
              Conoce sus eventos emocionales y acompaña su proceso de crecimiento.
            </p>
          )}
        </header>
        {profileLoading && <p className="text-sm text-slate-500">Cargando perfil...</p>}
        {profileError && <p className="text-sm text-rose-600">{profileError}</p>}
        {!profileLoading && !profileError && profile && (
          <div className="space-y-6">
            {profile.jardin ? (
              <div className="rounded-2xl bg-gradient-to-br from-emerald-100 via-sky-100 to-white p-4">
                <p className="text-lg font-semibold text-gardenGreen">
                  Salud del jardín: {profile.jardin.estado_salud}%
                </p>
                <p className="text-sm text-slate-600">
                  Última actualización:{' '}
                  {new Date(profile.jardin.ultima_modificacion).toLocaleString('es-ES', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Este usuario aún no tiene un jardín configurado.</p>
            )}

            <div>
              <h3 className="text-lg font-semibold text-gardenSoil">Eventos compartidos</h3>
              {profile.jardin?.plantas?.length ? (
                <ul className="mt-3 space-y-3">
                  {profile.jardin.plantas.map((plant) => (
                    <li key={plant.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-base font-semibold text-gardenSoil">{plant.nombre}</p>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gardenGreen">
                            {plant.categoria}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase text-white ${renderEventBadge(
                            plant.tipo
                          )}`}
                        >
                          {plant.tipo}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">{plant.descripcion || 'Sin descripción disponible.'}</p>
                      <time className="mt-2 block text-xs text-slate-500">
                        {new Date(plant.fecha_plantado).toLocaleString('es-ES', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </time>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-slate-600">Todavía no hay eventos registrados para mostrar.</p>
              )}
            </div>
          </div>
        )}
        {!profileLoading && !profileError && !profile && friends.length > 0 && (
          <p className="text-sm text-slate-600">Selecciona un amigo para ver su jardín emocional.</p>
        )}
        {!profileLoading && !profileError && friends.length === 0 && (
          <p className="text-sm text-slate-600">
            Cuando agregues amigos podrás explorar aquí sus jardines y eventos emocionales.
          </p>
        )}
      </section>
    </div>
  );
};

export default ComunidadView;
