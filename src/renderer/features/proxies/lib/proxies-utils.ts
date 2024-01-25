import type { Account, ProxyAction, NoID, Wallet, ChainId } from '@shared/core';
import { NotificationType, Chain, type PartialProxiedAccount } from '@shared/core';
import { dictionary } from '@shared/lib/utils';
import { proxyUtils } from '@entities/proxy';
import { walletUtils } from '@entities/wallet';

export const proxiesUtils = {
  isRegularProxy,
  getNotification,
  isProxiedAvailable,
};

function isRegularProxy(chain: Chain): boolean {
  return Boolean(chain.options?.includes('regular_proxy'));
}

type GetNotificationParams = {
  proxiedAccounts: PartialProxiedAccount[];
  wallets: Wallet[];
  accounts: Account[];
  chains: Record<ChainId, Chain>;
  type: NotificationType;
};
function getNotification({
  proxiedAccounts,
  wallets,
  accounts,
  chains,
  type,
}: GetNotificationParams): NoID<ProxyAction>[] {
  const walletsMap = dictionary(wallets, 'id', ({ name, type }) => ({ name, type }));
  const accountsWalletsMap = dictionary(accounts, 'accountId', (account) => walletsMap[account.walletId]);

  return proxiedAccounts.map((proxied) => {
    const addressPrefix = chains[proxied.chainId].addressPrefix;

    return {
      chainId: proxied.chainId,
      dateCreated: Date.now(),
      proxyType: proxied.proxyType,
      proxyAccountId: proxied.proxyAccountId,
      proxyWalletName: accountsWalletsMap[proxied.proxyAccountId].name,
      proxyWalletType: accountsWalletsMap[proxied.proxyAccountId].type,
      proxiedAccountId: proxied.accountId,
      proxiedWalletName: proxyUtils.getProxiedName(proxied.accountId, proxied.proxyType, addressPrefix),
      read: false,
      type,
    };
  });
}

function isProxiedAvailable(wallet?: Wallet): boolean {
  return !walletUtils.isWatchOnly(wallet) && !walletUtils.isProxied(wallet);
}