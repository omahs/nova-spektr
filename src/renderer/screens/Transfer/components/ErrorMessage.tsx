import { PropsWithChildren } from 'react';
import cn from 'classnames';
import { FieldError } from 'react-hook-form';

type Props = {
  error?: FieldError;
  type: string;
  className?: string;
};

const ErrorMessage = ({ error, type, className, children }: PropsWithChildren<Props>) => {
  if (error?.type !== type) {
    return null;
  }

  return <p className={cn('text-error text-2xs font-bold uppercase', className)}>{children}</p>;
};

export default ErrorMessage;