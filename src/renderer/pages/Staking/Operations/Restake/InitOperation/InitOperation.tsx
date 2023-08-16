import { ApiPromise } from '@polkadot/api';
import { BN } from '@polkadot/util';
import { useEffect, useState } from 'react';

import { DropdownOption, DropdownResult } from '@renderer/shared/ui/Dropdowns/common/types';
import { useI18n } from '@renderer/app/providers';
import { Asset, useBalance, Balance as AccountBalance } from '@renderer/entities/asset';
import { ChainId, AccountId, SigningType } from '@renderer/domain/shared-kernel';
import { Transaction, TransactionType } from '@renderer/entities/transaction';
import { useAccount, Account, isMultisig } from '@renderer/entities/account';
import { formatAmount, unlockingAmount, toAddress, nonNullable } from '@renderer/shared/lib/utils';
import { StakingMap, useStakingData } from '@renderer/entities/staking';
import { OperationForm } from '../../components';
import { Select, MultiSelect, InputHint } from '@renderer/shared/ui';
import {
  getRestakeAccountOption,
  validateRestake,
  validateBalanceForFee,
  getSignatoryOptions,
  validateBalanceForFeeDeposit,
} from '../../common/utils';

export type RestakeResult = {
  accounts: Account[];
  amount: string;
  signer?: Account;
  description?: string;
};

type Props = {
  api: ApiPromise;
  chainId: ChainId;
  accounts: Account[];
  addressPrefix: number;
  asset: Asset;
  onResult: (data: RestakeResult) => void;
};

const InitOperation = ({ api, chainId, accounts, addressPrefix, asset, onResult }: Props) => {
  const { t } = useI18n();
  const { getLiveAccounts } = useAccount();
  const { subscribeStaking } = useStakingData();
  const { getLiveAssetBalances } = useBalance();

  const dbAccounts = getLiveAccounts();

  const [fee, setFee] = useState('');
  const [feeLoading, setFeeLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [deposit, setDeposit] = useState('');
  const [staking, setStaking] = useState<StakingMap>({});

  const [minBalance, setMinBalance] = useState<string>('0');

  const [restakeAccounts, setRestakeAccounts] = useState<DropdownOption<Account>[]>([]);
  const [activeRestakeAccounts, setActiveRestakeAccounts] = useState<DropdownResult<Account>[]>([]);

  const [activeSignatory, setActiveSignatory] = useState<DropdownResult<Account>>();
  const [signatoryOptions, setSignatoryOptions] = useState<DropdownOption<Account>[]>([]);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeBalances, setActiveBalances] = useState<AccountBalance[]>([]);

  const firstAccount = activeRestakeAccounts[0]?.value;
  const accountIsMultisig = isMultisig(firstAccount);
  const formFields = accountIsMultisig ? [{ name: 'amount' }, { name: 'description' }] : [{ name: 'amount' }];

  const accountIds = accounts.map((account) => account.accountId);
  const balances = getLiveAssetBalances(accountIds, chainId, asset.assetId.toString());

  const signatoryIds = accountIsMultisig ? firstAccount.signatories.map((s) => s.accountId) : [];
  const signatoriesBalances = getLiveAssetBalances(signatoryIds, chainId, asset.assetId.toString());
  const signerBalance = signatoriesBalances.find((b) => b.accountId === activeSignatory?.value.accountId);

  useEffect(() => {
    const addresses = activeRestakeAccounts.map((stake) => toAddress(stake.id, { prefix: addressPrefix }));

    let unsubStaking: () => void | undefined;
    (async () => {
      unsubStaking = await subscribeStaking(chainId, api, addresses, setStaking);
    })();

    return () => {
      unsubStaking?.();
    };
  }, [api, activeRestakeAccounts.length]);

  useEffect(() => {
    const balancesMap = new Map(balances.map((balance) => [balance.accountId, balance]));
    const newActiveBalances = activeRestakeAccounts
      .map((a) => balancesMap.get(a.id as AccountId))
      .filter(nonNullable) as AccountBalance[];

    setActiveBalances(newActiveBalances);
  }, [activeRestakeAccounts.length, balances]);

  useEffect(() => {
    if (!Object.keys(staking).length) return;

    const stakedBalances = activeRestakeAccounts.map((a) => {
      const address = toAddress(a.id, { prefix: addressPrefix });

      return unlockingAmount(staking[address]?.unlocking);
    });

    const minStakedBalance = stakedBalances.reduce<string>((acc, balance) => {
      if (!balance) return acc;

      return new BN(balance).lt(new BN(acc)) ? balance : acc;
    }, stakedBalances[0]);

    setMinBalance(minStakedBalance);
  }, [activeRestakeAccounts.length, staking]);

  useEffect(() => {
    const formattedAccounts = accounts.map((account) => {
      const balance = balances.find((b) => b.accountId === account.accountId);
      const address = toAddress(account.accountId, { prefix: addressPrefix });
      const stake = staking[address];

      return getRestakeAccountOption(account, { balance, stake, asset, fee, addressPrefix, amount });
    });

    setRestakeAccounts(formattedAccounts);
  }, [staking, amount, fee, balances, accounts.length]);

  useEffect(() => {
    if (!accountIsMultisig) return;

    const signerOptions = dbAccounts.reduce<DropdownOption<Account>[]>((acc, signer) => {
      const isWatchOnly = signer.signingType === SigningType.WATCH_ONLY;
      const signerExist = signatoryIds.includes(signer.accountId);
      if (!isWatchOnly && signerExist) {
        const balance = signatoriesBalances.find((b) => b.accountId === signer.accountId);

        acc.push(getSignatoryOptions(signer, { addressPrefix, asset, balance }));
      }

      return acc;
    }, []);

    if (signerOptions.length === 0) return;

    setSignatoryOptions(signerOptions);
    setActiveSignatory({ id: signerOptions[0].id, value: signerOptions[0].value });
  }, [accountIsMultisig, dbAccounts.length, signatoriesBalances.length]);

  useEffect(() => {
    if (restakeAccounts.length === 0) return;

    const activeAccounts = restakeAccounts.map(({ id, value }) => ({ id, value }));
    setActiveRestakeAccounts(activeAccounts);
  }, [restakeAccounts.length]);

  useEffect(() => {
    const newTransactions = activeRestakeAccounts.map(({ value }) => {
      return {
        chainId,
        type: TransactionType.RESTAKE,
        address: toAddress(value.accountId, { prefix: addressPrefix }),
        args: { value: formatAmount(amount, asset.precision) },
      };
    });

    setTransactions(newTransactions);
  }, [activeRestakeAccounts.length, amount]);

  const submitRestake = (data: { amount: string; description?: string }) => {
    const selectedAccountIds = activeRestakeAccounts.map((stake) => stake.id);
    const selectedAccounts = accounts.filter((account) => selectedAccountIds.includes(account.accountId));

    onResult({
      accounts: selectedAccounts,
      amount: formatAmount(data.amount, asset.precision),
      ...(accountIsMultisig && {
        description: data.description || t('transactionMessage.restake', { amount: data.amount, asset: asset.symbol }),
        signer: activeSignatory?.value,
      }),
    });
  };

  const validateBalance = (amount: string): boolean => {
    return activeRestakeAccounts.every((a) => {
      const address = toAddress(a.id, { prefix: addressPrefix });

      return validateRestake(staking[address] || '0', amount, asset.precision);
    });
  };

  const validateFee = (): boolean => {
    if (!accountIsMultisig) {
      return activeBalances.every((b) => validateBalanceForFee(b, fee));
    }

    if (!signerBalance) return false;

    return validateBalanceForFee(signerBalance, fee);
  };

  const validateDeposit = (): boolean => {
    if (!accountIsMultisig) return true;
    if (!signerBalance) return false;

    return validateBalanceForFeeDeposit(signerBalance, deposit, fee);
  };

  const getBalanceRange = (): string | string[] => {
    if (activeSignatory) return minBalance;

    return activeBalances.length > 1 ? ['0', minBalance] : minBalance;
  };

  const getActiveAccounts = (): AccountId[] => {
    if (!accountIsMultisig) return activeRestakeAccounts.map((acc) => acc.id as AccountId);

    return activeSignatory ? [activeSignatory.id as AccountId] : [];
  };

  const canSubmit = !feeLoading && (activeRestakeAccounts.length > 0 || Boolean(activeSignatory));

  return (
    <div className="flex flex-col gap-y-4 w-[440px] px-5 py-4">
      <OperationForm
        chainId={chainId}
        accounts={getActiveAccounts()}
        canSubmit={canSubmit}
        addressPrefix={addressPrefix}
        fields={formFields}
        balanceRange={getBalanceRange()}
        asset={asset}
        validateBalance={validateBalance}
        validateFee={validateFee}
        validateDeposit={validateDeposit}
        footer={
          <OperationForm.Footer
            api={api}
            asset={asset}
            account={firstAccount}
            totalAccounts={activeRestakeAccounts.length}
            transaction={transactions[0]}
            onFeeChange={setFee}
            onFeeLoading={setFeeLoading}
            onDepositChange={setDeposit}
          />
        }
        onSubmit={submitRestake}
        onAmountChange={setAmount}
      >
        {({ invalidBalance, invalidFee, invalidDeposit }) =>
          accountIsMultisig ? (
            <div className="flex flex-col gap-y-2 mb-4">
              <Select
                label={t('staking.bond.signatoryLabel')}
                placeholder={t('staking.bond.signatoryPlaceholder')}
                disabled={!signatoryOptions.length}
                invalid={invalidDeposit || invalidFee}
                selectedId={activeSignatory?.id}
                options={signatoryOptions}
                onChange={setActiveSignatory}
              />
              <InputHint active={!signatoryOptions.length}>{t('multisigOperations.noSignatory')}</InputHint>
            </div>
          ) : (
            <MultiSelect
              className="mb-4"
              label={t('staking.bond.accountLabel')}
              placeholder={t('staking.bond.accountPlaceholder')}
              multiPlaceholder={t('staking.bond.manyAccountsPlaceholder')}
              invalid={invalidBalance || invalidFee}
              selectedIds={activeRestakeAccounts.map((acc) => acc.id)}
              options={restakeAccounts}
              onChange={setActiveRestakeAccounts}
            />
          )
        }
      </OperationForm>
    </div>
  );
};

export default InitOperation;