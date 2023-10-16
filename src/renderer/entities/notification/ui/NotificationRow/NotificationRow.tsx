import { format } from 'date-fns';
import { TFunction, Trans } from 'react-i18next';
import { useUnit } from 'effector-react';

import { BodyText, FootnoteText } from '@renderer/shared/ui';
import {
  MultisigAccountInvitedNotification,
  MultisigNotification,
  MultisigNotificationType,
  Notification,
} from '../../model/notification';
import { useI18n } from '@renderer/app/providers';
import { WalletIcon, walletModel } from '@renderer/entities/wallet';
import { Wallet } from '@renderer/shared/core';

const NotificationBody = {
  [MultisigNotificationType.ACCOUNT_INVITED]: (n: Notification, t: TFunction, w?: Wallet) => {
    if (!w) {
      return <div className="flex"></div>;
    }
    const typedNotification = n as Notification & MultisigNotification & MultisigAccountInvitedNotification;

    return (
      <BodyText className="inline-flex">
        <Trans
          t={t}
          i18nKey="notifications.details.newMultisigAccountDescription"
          values={{
            threshold: typedNotification.threshold,
            signatories: typedNotification.signatories.length,
            name: w.name,
          }}
          components={{
            identicon: <WalletIcon type={w.type} size={20} className="inline mx-2" />,
          }}
        />
      </BodyText>
    );
  },
  [MultisigNotificationType.MST_CREATED]: () => <div className="flex"></div>,
  [MultisigNotificationType.MST_APPROVED]: () => <div className="flex"></div>,
  [MultisigNotificationType.MST_EXECUTED]: () => <div className="flex"></div>,
  [MultisigNotificationType.MST_CANCELLED]: () => <div className="flex"></div>,
} as const;

type Props = {
  notification: Notification;
};

export const NotificationRow = ({ notification }: Props) => {
  const { t, dateLocale } = useI18n();
  const wallets = useUnit(walletModel.$wallets);
  const account = useUnit(walletModel.$accounts).find((a) => a.accountId === notification.multisigAccountId);
  const notificationWallet = wallets.find((w) => w.id === account?.walletId);

  const { dateCreated, type } = notification;

  return (
    <li className="flex flex-col bg-block-background-default rounded">
      <div className="py-4 pl-6 pr-6 flex">
        <FootnoteText className="text-text-tertiary pr-5.5 leading-5">
          {format(new Date(dateCreated || 0), 'p', { locale: dateLocale })}
        </FootnoteText>
        {NotificationBody[type](notification, t, notificationWallet)}
      </div>
    </li>
  );
};
