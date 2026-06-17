import React, { useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useDispatch } from 'react-redux';

import {

  Button,

  EnrollmentProgress,

  SuccessIcon,

  Loader,

  completeEnrollmentLogin,

  persistSession,

  setAuthData,

  setAuthenticated,

} from '@doevents/shared';



export const EnrolmentSuccessPage: React.FC = () => {

  const navigate = useNavigate();

  const dispatch = useDispatch();

  const [checking, setChecking] = useState(true);



  useEffect(() => {

    let cancelled = false;

    const tryAutoLogin = async () => {

      try {

        const result = await completeEnrollmentLogin();

        if (cancelled) return;

        if (result?.success && result.data?.token) {

          const { token, user } = result.data;

          dispatch(setAuthData({ token, idUser: user.userId }));

          dispatch(setAuthenticated(true));

          persistSession(token, user.userId);

          navigate('/');

          return;

        }

      } finally {

        if (!cancelled) setChecking(false);

      }

    };

    tryAutoLogin();

    return () => { cancelled = true; };

  }, [dispatch, navigate]);



  if (checking) return <Loader />;



  return (

    <div className="de-page de-page--enrollment">

      <div className="de-full-container">

        <EnrollmentProgress value={100} />



        <div className="de-enrollment-success">

          <SuccessIcon />

          <h2>¡Estupendo!</h2>

          <p className="de-enrollment-success__lead">Has completado tu registro con éxito.</p>

          <p className="de-enrollment-success__body">

            Ahora puedes buscar o crear eventos dentro de la plataforma. ¡Bienvenido!

          </p>

        </div>



        <div className="de-enrollment-actions">

          <Button label="Iniciar sesión" tone="lovable" onClick={() => navigate('/auth/login')} />

        </div>

      </div>

    </div>

  );

};



export default EnrolmentSuccessPage;


