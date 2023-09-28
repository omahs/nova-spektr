import { ApiPromise } from '@polkadot/api';
import { useEffect, useState, memo } from 'react';
import { useUnit } from 'effector-react';

import { Asset, AssetBalance } from '@renderer/entities/asset';
import { Threshold } from '@renderer/domain/shared-kernel';
import { useTransaction } from '@renderer/entities/transaction';
import { AssetFiatBalance } from '@renderer/entities/price/ui/AssetFiatBalance';
import { priceProviderModel } from '@renderer/entities/price';

type Props = {
  api: ApiPromise;
  asset: Asset;
  threshold: Threshold;
  className?: string;
  onDepositChange?: (deposit: string) => void;
};

export const Deposit = memo(({ api, asset, threshold, className, onDepositChange }: Props) => {
  const { getTransactionDeposit } = useTransaction();

  const fiatFlag = useUnit(priceProviderModel.$fiatFlag);
  const [deposit, setDeposit] = useState('');

  useEffect(() => {
    const txDeposit = getTransactionDeposit(threshold, api);

    setDeposit(txDeposit);
    onDepositChange?.(txDeposit);
  }, [threshold, api]);

  if (!fiatFlag) {
    return <AssetBalance value={deposit} asset={asset} className={className} />;
  }

  return (
    <div className="flex flex-col gap-y-0.5 items-end">
      <AssetBalance value={deposit} asset={asset} className={className} />
      <AssetFiatBalance asset={asset} amount={deposit} />
    </div>
  );
});
