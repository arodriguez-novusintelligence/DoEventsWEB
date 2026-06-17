import React, { useCallback, useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useDispatch, useSelector } from 'react-redux';

import { getEnvironment } from '@config/environments/index';

import { hasAcceptedTerms } from './TermsAcceptancePage';

import {
  Button,
  Loader,
  useToast,
  saveUserPreferences,
  persistEnrollmentUserId,
  getEnrollmentUserId,
  setAuthData,
  setAuthenticated,
  persistSession,
  completeEnrollmentLogin,
  initApiClient,
  Preference,
  RootState,
  EnrollmentProgress,
  PreferenceTag,
  EnrollmentRadioGroup,
} from '@doevents/shared';



interface RawPreference {

  preference_id?: number;

  preference_name_es?: string;

  preference_name_en?: string;

  id?: number;

  name?: string;

}



function mapPrefs(raw: RawPreference[]): Preference[] {

  return raw

    .map((item) => ({

      id: Number(item.preference_id ?? item.id),

      name: item.preference_name_es || item.preference_name_en || item.name || '',

    }))

    .filter((p) => Number.isFinite(p.id) && p.id > 0 && p.name);

}



async function fetchPrefsFromApi(): Promise<Preference[]> {

  const url = getEnvironment().endpoints.preferences;

  const response = await fetch(url, {

    method: 'GET',

    headers: { Accept: 'application/json' },

  });

  if (!response.ok) {

    throw new Error(`Error ${response.status} al cargar preferencias`);

  }

  const body = await response.json() as { data?: RawPreference[] };

  return mapPrefs(body.data || []);

}



export const GustosPage: React.FC = () => {

  const navigate = useNavigate();

  const dispatch = useDispatch();

  const { showToast } = useToast();

  const reduxUserId = useSelector((s: RootState) => s.auth.idUser);

  const userId = reduxUserId || getEnrollmentUserId();

  useEffect(() => {
    if (!hasAcceptedTerms()) {
      navigate('/auth/terms', { replace: true });
    }
  }, [navigate]);

  const [preferences, setPreferences] = useState<Preference[]>([]);

  const [selected, setSelected] = useState<number[]>([]);

  const [createEvents, setCreateEvents] = useState('No');

  const [provideServices, setProvideServices] = useState('No');

  const [havePlace, setHavePlace] = useState('No');

  const [loading, setLoading] = useState(true);

  const [loadError, setLoadError] = useState('');

  const [statusMessage, setStatusMessage] = useState('');

  const [submitting, setSubmitting] = useState(false);



  const notify = useCallback((message: string, type: 'success' | 'error' = 'error') => {

    setStatusMessage(message);

    showToast(message, type);

  }, [showToast]);



  const loadPreferences = useCallback(async () => {

    setLoading(true);

    setLoadError('');

    setStatusMessage('');

    try {

      initApiClient(getEnvironment());

      const items = await fetchPrefsFromApi();

      setPreferences(items);

      if (items.length === 0) {

        setLoadError('No hay preferencias disponibles en este momento.');

      }

    } catch (err) {

      const msg = err instanceof Error ? err.message : 'No se pudieron cargar las preferencias.';

      setLoadError(msg);

      notify(msg, 'error');

    } finally {

      setLoading(false);

    }

  }, [notify]);



  useEffect(() => {

    if (!userId) {

      notify('Sesión de registro no encontrada. Inicia sesión nuevamente.', 'error');

      navigate('/auth/login');

      return;

    }

    persistEnrollmentUserId(userId);

    dispatch(setAuthData({ token: '', idUser: userId }));

    loadPreferences();

  }, [dispatch, loadPreferences, navigate, notify, userId]);



  const togglePreference = (id: number) => {

    setSelected((prev) =>

      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],

    );

    setStatusMessage('');

  };



  const finishEnrollment = async () => {

    const loginResult = await completeEnrollmentLogin();

    if (loginResult?.success && loginResult.data?.token) {

      const { token, user } = loginResult.data;

      dispatch(setAuthData({ token, idUser: user.userId }));

      dispatch(setAuthenticated(true));

      persistSession(token, user.userId);

      notify('¡Bienvenido a Do•events!', 'success');
      navigate('/', { replace: true });
      window.setTimeout(() => {
        if (window.location.pathname.startsWith('/auth')) {
          window.location.assign('/');
        }
      }, 300);
      return;

    }

    navigate('/auth/enrolment-success');

  };

  const handleSubmit = async () => {

    if (!userId) {

      notify('No se encontró el usuario. Vuelve a iniciar sesión.', 'error');

      navigate('/auth/login');

      return;

    }

    if (!preferences.length) {

      notify('Las preferencias no cargaron. Pulsa Reintentar.', 'error');

      return;

    }

    if (!selected.length) {

      notify('Selecciona al menos una preferencia para continuar.', 'error');

      return;

    }

    setSubmitting(true);

    setStatusMessage('Guardando preferencias...');

    try {

      initApiClient(getEnvironment());

      const result = await saveUserPreferences({

        userId,

        preferences: selected,

        createEvents,

        provideServices,

        havePlace,

      });

      if (!result.success) {

        notify(result.message || 'No se pudieron guardar las preferencias', 'error');

        return;

      }

      notify(result.message || 'Gustos guardados correctamente', 'success');

      await finishEnrollment();

    } catch (error: unknown) {

      const axiosError = error as { response?: { data?: { message?: string } }; message?: string };

      notify(

        axiosError.response?.data?.message || axiosError.message || 'Error al guardar preferencias',

        'error',

      );

    } finally {

      setSubmitting(false);

    }

  };



  if (loading) return <Loader />;



  const canSubmit = !submitting && preferences.length > 0 && selected.length > 0;



  return (

    <div className="de-page de-page--enrollment">

      <div className="de-full-container">

        <EnrollmentProgress value={60} />



        <div className="de-enrollment-heading">

          <h2>Gustos y servicios</h2>

          <p>Selecciona algunos eventos a los cuales te gusta ir o participar</p>

        </div>



        {statusMessage && (

          <div className={`de-gustos-banner de-gustos-banner--${statusMessage.includes('correctamente') || statusMessage.includes('Bienvenido') ? 'success' : 'info'}`}>

            {statusMessage}

          </div>

        )}



        <div className="de-card de-card--lovable de-card--compact de-gustos-tags-card">

          {loadError || preferences.length === 0 ? (

            <>

              <p className="de-empty-state">{loadError || 'No hay preferencias disponibles.'}</p>

              <Button label="Reintentar" variant="secondary" tone="lovable" onClick={loadPreferences} />

            </>

          ) : (

            <div className="de-preference-tags">

              {preferences.map((pref) => (

                <PreferenceTag

                  key={pref.id}

                  label={pref.name}

                  selected={selected.includes(pref.id)}

                  onToggle={() => togglePreference(pref.id)}

                />

              ))}

            </div>

          )}

        </div>



        {preferences.length > 0 && selected.length === 0 && (

          <p className="de-gustos-hint">Toca una o más categorías para activar el botón de guardar.</p>

        )}



        {selected.length > 0 && (

          <p className="de-gustos-selected-hint">

            {selected.length} preferencia{selected.length === 1 ? '' : 's'} seleccionada{selected.length === 1 ? '' : 's'}

          </p>

        )}



        <div className="de-card de-card--lovable de-card--compact de-gustos-questions-card">

          <div className="de-enrollment-questions de-enrollment-questions--in-card">

            <EnrollmentRadioGroup

              name="createEvents"

              label="¿Te gustaría crear eventos?"

              value={createEvents}

              onChange={setCreateEvents}

            />

            <EnrollmentRadioGroup

              name="provideServices"

              label="¿Prestas servicios para eventos?"

              value={provideServices}

              onChange={setProvideServices}

            />

            <EnrollmentRadioGroup

              name="havePlace"

              label="¿Cuentas con un lugar/sitio/negocio para realizar eventos?"

              value={havePlace}

              onChange={setHavePlace}

            />

          </div>

        </div>



        <div className="de-enrollment-actions">

          <Button

            label={submitting ? 'Guardando...' : 'Guardar preferencias'}

            tone="lovable"

            disabled={!canSubmit}

            onClick={handleSubmit}

          />

          {!canSubmit && !submitting && (

            <p className="de-gustos-hint de-gustos-hint--center">

              {preferences.length === 0

                ? 'Esperando preferencias...'

                : 'Selecciona al menos una categoría arriba.'}

            </p>

          )}

        </div>

      </div>

    </div>

  );

};


