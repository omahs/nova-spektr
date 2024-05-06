import { createEffect, createEvent, sample, scopeBind } from 'effector';
import { once } from 'patronum';
import { GraphQLClient } from 'graphql-request';

import type { Account, Chain, ChainId, Connection, MultisigAccount } from '@shared/core';
import { AccountType, ChainType, CryptoType, ExternalType, SigningType, WalletType } from '@shared/core';
import { networkModel, networkUtils } from '@entities/network';
import { accountUtils, walletModel } from '@entities/wallet';
import { MultisigResult, multisigService } from '@entities/multisig/api/MultisigsService';
import { multisigUtils } from '../lib/multisig-utils';
import { isEthereumAccountId, toAddress } from '@/src/renderer/shared/lib/utils';
import { CreateParams } from '@/src/renderer/entities/wallet/model/wallet-model';

const multisigsDiscoveryStarted = createEvent();
const chainConnected = createEvent<ChainId>();

type GetMultisigsParams = {
  chain: Chain;
  accounts: Account[];
};

type StartChainsProps = {
  chains: Chain[];
  connections: Record<ChainId, Connection>;
};

type GetMultisigsResult = {
  chain: Chain;
  indexedMultisigs: MultisigResult[];
};

const connectChainsFx = createEffect(({ chains, connections }: StartChainsProps) => {
  const boundConnected = scopeBind(chainConnected, { safe: true });

  chains.forEach((chain) => {
    if (networkUtils.isDisabledConnection(connections[chain.chainId])) return;
    boundConnected(chain.chainId);
  });
});

const getMultisigsFx = createEffect(async ({ chain, accounts }: GetMultisigsParams): Promise<GetMultisigsResult> => {
  const multisigIndexerUrl =
    networkUtils.isMultisigSupported(chain.options) && chain.externalApi?.[ExternalType.MULTISIG]?.[0]?.url;

  if (multisigIndexerUrl && accounts.length) {
    const client = new GraphQLClient(multisigIndexerUrl);

    const indexedMultisigs = await multisigService.filterMultisigsAccountIds(
      client,
      accounts.map((account) => account.accountId),
    );

    indexedMultisigs.length > 0 && console.log('<><><><><><><><><><><><> indexedMultisigs', indexedMultisigs);

    return {
      indexedMultisigs,
      chain,
    };
  }

  return {
    indexedMultisigs: [],
    chain,
  };
});

const saveMultisigFx = createEffect((multisigsToAdd: CreateParams<MultisigAccount>[]) => {
  multisigsToAdd.length && console.log('<><><><><><><><><><><><> multisigToAdd', multisigsToAdd);

  multisigsToAdd.forEach((multisig) => walletModel.events.multisigCreated(multisig));
});

sample({
  clock: [multisigsDiscoveryStarted, once(networkModel.$connections)],
  source: {
    connections: networkModel.$connections,
    chains: networkModel.$chains,
  },
  fn: ({ connections, chains }) => ({
    chains: Object.values(chains).filter((chain) => multisigUtils.isMultisigSupported(chain)),
    connections,
  }),
  target: connectChainsFx,
});

sample({
  clock: chainConnected,
  source: {
    accounts: walletModel.$accounts,
    chains: networkModel.$chains,
    wallets: walletModel.$wallets,
  },
  fn: ({ accounts, chains, wallets }, chainId) => ({
    chainId,
    chain: chains[chainId],
    accounts: accounts.filter((a) => accountUtils.isChainIdMatch(a, chainId)),
    wallets,
  }),
  target: getMultisigsFx,
});

sample({
  clock: getMultisigsFx.doneData,
  source: {
    accounts: walletModel.$accounts,
  },
  filter: (_, { indexedMultisigs }) => {
    return indexedMultisigs.length > 0;
  },
  fn: ({ accounts }, { indexedMultisigs, chain }) => {
    console.log('<><><><><><><><><><><><> indexedMultisigs', indexedMultisigs);
    console.log(accounts);
    const multisigsToSave = indexedMultisigs.filter((multisigrResult) => {
      return accounts.every((account) => account.accountId !== multisigrResult.accountId);
    });

    const result = multisigsToSave.map(
      ({ threshold, accountId, signatories }) =>
        ({
          wallet: {
            name: `Detected msig ${toAddress(accountId).slice(0, 7)}...`,
            type: WalletType.MULTISIG,
            signingType: SigningType.MULTISIG,
          },
          accounts: [
            {
              threshold: threshold,
              // todo remove this, it'll go away with the matrix removal
              creatorAccountId: '0x',
              accountId: accountId,
              signatories: signatories.map((signatory) => ({
                accountId: signatory,
                // todo remove this, it'll go away with the matrix removal
                matrixId: '',
                address: toAddress(signatory),
              })),
              name: `Detected msig ${toAddress(accountId).slice(0, 7)}...`,
              chainId: chain.chainId,
              // todo remove this, it'll go away with the matrix removal
              matrixRoomId: '',
              cryptoType: isEthereumAccountId(accountId) ? CryptoType.ETHEREUM : CryptoType.SR25519,
              chainType: ChainType.SUBSTRATE,
              type: AccountType.MULTISIG,
            },
          ],
        } as CreateParams<MultisigAccount>),
    );

    console.log('===> Creating', result);

    return result;
  },
  target: saveMultisigFx,
});

export const multisigsModel = {
  events: {
    multisigsDiscoveryStarted,
  },
};