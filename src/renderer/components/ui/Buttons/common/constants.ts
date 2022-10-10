import { Pallet, Variant } from './types';

export const ViewClass: Record<`${Variant}_${Pallet}`, string> = {
  text_primary: 'text-primary border-white bg-white',
  text_secondary: 'text-secondary border-white bg-white',
  text_error: 'text-error border-white bg-white',
  text_shade: 'text-shade-40 border-white bg-white',
  text_alert: 'text-alert border-white bg-white',
  text_dark: 'text-neutral border-white bg-white',
  fill_primary: 'text-white border-primary bg-primary',
  fill_secondary: 'text-white border-secondary bg-secondary',
  fill_error: 'text-white border-error bg-error',
  fill_shade: 'text-shade-40 border-shade-20 bg-shade-20',
  fill_alert: 'text-white border-alert bg-alert',
  fill_dark: 'text-white border-neutral bg-neutral',
  outline_primary: 'text-primary border-current',
  outline_secondary: 'text-secondary border-current',
  outline_error: 'text-error border-current',
  outline_shade: 'text-shade-40 border-shade-20',
  outline_alert: 'text-alert border-alert',
  outline_dark: 'text-neutral border-neutral',
};

export const WeightClass = {
  sm: 'text-xs leading-3.5 font-semibold h-6 px-2 rounded-md',
  md: 'text-sm leading-3.5 font-semibold h-7.5 px-2 rounded-lg',
  lg: 'text-base leading-5 font-semibold h-10 px-3 rounded-2lg',
};
