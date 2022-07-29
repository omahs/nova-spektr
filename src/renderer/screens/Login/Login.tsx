import { ChangeEvent, useState } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { Button, Input } from '@renderer/components/ui';
import { useMatrix } from '@renderer/context/MatrixContext';
import { BASE_MATRIX_URL, ErrorObject } from '@renderer/services/matrix';
import Paths from '@renderer/routes/paths';

type LoginForm = {
  homeserver: string;
  username: string;
  password: string;
};

const Login = () => {
  const navigate = useNavigate();
  const { matrix, setIsLoggedIn } = useMatrix();

  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoginFailed, setIsLoginFailed] = useState(false);
  const [formError, setFormError] = useState('');

  const {
    control,
    handleSubmit,
    formState: { isValid },
  } = useForm<LoginForm>({
    mode: 'onChange',
    defaultValues: {
      homeserver: BASE_MATRIX_URL.replace('https://', ''),
      username: '',
      password: '',
    },
  });

  const onLogin: SubmitHandler<LoginForm> = async ({ homeserver, username, password }) => {
    setIsProcessing(true);

    try {
      await matrix.setHomeserver(homeserver);
      await matrix.loginWithCreds(username, password);
      setIsLoggedIn(true);
      navigate(Paths.WALLETS);
    } catch (error) {
      console.warn(error);
      setIsLoginFailed(true);
      setFormError((error as ErrorObject).message);
    }

    setIsProcessing(false);
  };

  const onInputChange = (event: ChangeEvent<HTMLInputElement>, onChange: (value: string) => void) => {
    if (isLoginFailed) {
      setIsLoginFailed(false);
    }
    onChange(event.target.value.trim());
  };

  const onSkip = () => {
    matrix.skipLogin(true);
    navigate(Paths.WALLETS);
  };

  return (
    <div className="flex flex-col items-center mx-auto bg-stripes bg-cover h-screen">
      <header className="flex flex-col items-center pt-14">
        <h1 className="mt-5 mb-3 font-bold text-3xl">Welcome to Omni Enterprise!</h1>
        <div className="text-xl">Let&apos;s start by login to Matrix</div>
      </header>
      <form className="flex flex-col mt-14 mb-3 gap-4 w-[300px]" onSubmit={handleSubmit(onLogin)}>
        <Controller
          name="homeserver"
          control={control}
          rules={{ required: true }}
          render={({ field: { value, onChange } }) => (
            <Input
              className="w-full"
              // label="Matrix ID"
              placeholder="Matrix homeserver"
              disabled={isProcessing}
              invalid={isLoginFailed}
              value={value}
              onChange={(e) => onInputChange(e, onChange)}
            />
          )}
        />
        <Controller
          name="username"
          control={control}
          rules={{ required: true }}
          render={({ field: { value, onChange } }) => (
            <Input
              className="w-full"
              // label="Matrix ID"
              placeholder="Username"
              disabled={isProcessing}
              invalid={isLoginFailed}
              value={value}
              onChange={(e) => onInputChange(e, onChange)}
            />
          )}
        />

        <Controller
          name="password"
          control={control}
          rules={{ required: true }}
          render={({ field: { value, onChange } }) => (
            <Input
              className="w-full"
              // label="Password"
              type="password"
              placeholder="Password"
              disabled={isProcessing}
              invalid={isLoginFailed}
              value={value}
              onChange={(e) => onInputChange(e, onChange)}
            />
          )}
        />
        <div className="text-error text-sm break-words">{formError}</div>
        <Button type="submit" weight="lg" variant="fill" pallet="primary" disabled={!isValid || isProcessing}>
          Login
        </Button>
      </form>
      <footer className="mt-auto pb-10 w-max">
        <Button
          className="w-[300px] mx-auto"
          weight="lg"
          variant="outline"
          pallet="primary"
          disabled={isProcessing}
          onClick={onSkip}
        >
          Skip login
        </Button>
        <div className="text-xs mt-4 text-gray-400">
          By skipping this step, some multisig features will not be available
        </div>
      </footer>
    </div>
  );
};

export default Login;