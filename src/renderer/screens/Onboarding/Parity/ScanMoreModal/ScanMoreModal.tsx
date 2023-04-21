import { hexToU8a, u8aToHex } from '@polkadot/util';
import { HexString } from '@polkadot/util/types';
import { useState, useEffect } from 'react';

import { SeedInfo, SimpleSeedInfo } from '@renderer/components/common/QrCode/QrReader/common/types';
import { BaseModal, Button, Icon, Identicon } from '@renderer/components/ui';
import { useI18n } from '@renderer/context/I18nContext';
import { Address, AccountId } from '@renderer/domain/shared-kernel';
import { toShortAddress, toAddress, toAccountId } from '@renderer/shared/utils/address';
import ParitySignerQrReader from '../ParitySignerQrReader/ParitySignerQrReader';

const enum CameraState {
  ACTIVE,
  ACCOUNT_EXISTS,
  NO_NEW_ACCOUNTS,
  SOME_ACCOUNTS_EXIST,
}

type RootAndDerived = {
  allRoot: AccountId[];
  allDerived: AccountId[];
};

type GroupedAccounts = {
  newAccs: SeedInfo[];
  oldAccs: SeedInfo[];
};

type Props = {
  isOpen: boolean;
  accounts: SimpleSeedInfo[];
  onResult: (accounts: SeedInfo[]) => void;
  onClose: () => void;
};

const ScanMoreModal = ({ isOpen, accounts, onResult, onClose }: Props) => {
  const { t } = useI18n();

  const [cameraState, setCameraState] = useState<CameraState>(CameraState.ACTIVE);
  const [existingAccounts, setExistingAccounts] = useState<Address[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    setCameraState(CameraState.ACTIVE);
    setExistingAccounts([]);
  }, [isOpen]);

  const allRootAndDerivedKeys = (): RootAndDerived => {
    return accounts.reduce<RootAndDerived>(
      (acc, account) => {
        acc.allRoot.push(toAccountId(account.address));

        const derivedKeys = Object.values(account.derivedKeys).flat();
        if (derivedKeys.length > 0) {
          const derivedAccountIds = derivedKeys.map((key) => toAccountId(key.address));
          acc.allDerived.push(...derivedAccountIds);
        }

        return acc;
      },
      { allRoot: [], allDerived: [] },
    );
  };

  const groupSingleAccount = (newAccounts: SeedInfo[], keys: RootAndDerived): GroupedAccounts => {
    const addressHex = u8aToHex(newAccounts[0].multiSigner.public);

    const existInRoot = keys.allRoot.some((key) => key === addressHex);
    const existInDerived = keys.allDerived.some((id) => id === addressHex);
    const isSameAccount = existInRoot || existInDerived;

    return {
      newAccs: isSameAccount ? [] : newAccounts,
      oldAccs: isSameAccount ? newAccounts : [],
    };
  };

  const groupRootAccounts = (newAccounts: SeedInfo[], allRoot: HexString[]): GroupedAccounts => {
    return newAccounts.reduce<GroupedAccounts>(
      (acc, newAccount) => {
        const addressHex = u8aToHex(newAccount.multiSigner?.public);
        const rootAccountIndex = allRoot.findIndex((key) => key === addressHex);

        const rootWithoutDerives = rootAccountIndex >= 0 && newAccount.derivedKeys.length === 0;
        if (rootWithoutDerives) {
          return { newAccs: acc.newAccs, oldAccs: acc.oldAccs.concat(newAccount) };
        }

        let rootWithDerives =
          rootAccountIndex >= 0 ? Object.values(accounts[rootAccountIndex].derivedKeys).flat().length > 0 : false;
        if (rootWithDerives) {
          return { newAccs: acc.newAccs, oldAccs: acc.oldAccs.concat(newAccount) };
        }

        const partialDerives = newAccount.derivedKeys.filter((key) => {
          const deriveIndex = allRoot.findIndex((address) => address === toAccountId(key.address));

          if (deriveIndex >= 0) {
            acc.oldAccs.push({
              name: '',
              derivedKeys: [],
              multiSigner: {
                MultiSigner: ['SR25519', 'ED25519', 'ECDSA'][key.encryption] as any,
                public: hexToU8a(allRoot[deriveIndex]),
              },
            });
          }

          return deriveIndex === -1;
        });

        if (rootAccountIndex >= 0 && partialDerives.length === 0) {
          return { newAccs: acc.newAccs, oldAccs: acc.oldAccs.concat({ ...newAccount, derivedKeys: [] }) };
        }

        return {
          oldAccs: acc.oldAccs,
          newAccs: acc.newAccs.concat({ ...newAccount, derivedKeys: partialDerives }),
        };
      },
      { oldAccs: [], newAccs: [] },
    );
  };

  const groupNewAccounts = (newAccounts: SeedInfo[]): GroupedAccounts => {
    const keys = allRootAndDerivedKeys();

    if (newAccounts.length === 1 && newAccounts[0].derivedKeys.length === 0) {
      return groupSingleAccount(newAccounts, keys);
    }

    return groupRootAccounts(newAccounts, keys.allRoot);
  };

  const onScanResult = (qrPayload: SeedInfo[]) => {
    const { newAccs, oldAccs } = groupNewAccounts(qrPayload);

    if (newAccs.length > 0) {
      if (oldAccs.length === 0) {
        onResult(newAccs);
        onClose();
      } else {
        onResult(newAccs);
        setCameraState(CameraState.SOME_ACCOUNTS_EXIST);
      }
    } else if (oldAccs.length > 1 || oldAccs[0].derivedKeys.length > 0) {
      setCameraState(CameraState.NO_NEW_ACCOUNTS);
      const oldAddresses = oldAccs.map(({ multiSigner }) => toAddress(u8aToHex(multiSigner?.public), { prefix: 0 }));
      setExistingAccounts(oldAddresses);
    } else {
      setCameraState(CameraState.ACCOUNT_EXISTS);
      setExistingAccounts([toAddress(u8aToHex(oldAccs[0].multiSigner?.public), { prefix: 0 })]);
    }
  };

  return (
    <BaseModal
      closeButton
      contentClass="p-0 mt-7 w-[500px] h-[500px]"
      title={t('onboarding.paritySigner.qrModalTitle')}
      isOpen={isOpen}
      onClose={onClose}
    >
      {cameraState === CameraState.ACTIVE && (
        <ParitySignerQrReader size={500} className="rounded-2lg" onResult={onScanResult} />
      )}
      {cameraState === CameraState.ACCOUNT_EXISTS && (
        <div className="flex flex-col justify-center items-center w-full h-full">
          <div className="flex flex-col items-center justify-center w-full h-full">
            <Identicon address={existingAccounts[0]} size={60} background={false} />
            <p className="text-neutral font-semibold text-xl">{toShortAddress(existingAccounts[0], 16)}</p>
            <p className="text-neutral-variant text-sm">{t('onboarding.paritySigner.existingAccountDescription')}</p>
          </div>
          <Button
            className="w-max mb-5"
            weight="lg"
            variant="fill"
            pallet="primary"
            onClick={() => setCameraState(CameraState.ACTIVE)}
          >
            {t('onboarding.paritySigner.tryAgainButton')}
          </Button>
        </div>
      )}
      {cameraState === CameraState.SOME_ACCOUNTS_EXIST && (
        <div className="flex flex-col justify-center items-center w-full h-full">
          <div className="flex flex-col items-center justify-center text-center w-full h-full">
            <Icon className="text-shade-40" name="warnCutout" size={70} />
            <p className="text-neutral text-xl leading-6 font-semibold mt-5">
              {t('onboarding.paritySigner.someOldAccountLabel')}
            </p>
            <p className="text-neutral-variant text-sm">{t('onboarding.paritySigner.someOldAccountDescription')}</p>
          </div>
          <Button className="w-max mb-5" weight="lg" variant="fill" pallet="primary" onClick={onClose}>
            {t('onboarding.paritySigner.continueButton')}
          </Button>
        </div>
      )}
      {cameraState === CameraState.NO_NEW_ACCOUNTS && (
        <div className="flex flex-col justify-center items-center w-full h-full">
          <div className="flex flex-col items-center justify-center text-center w-full h-full">
            <Icon className="text-alert" name="warnCutout" size={70} />
            <p className="text-neutral text-xl leading-6 font-semibold mt-5">
              {t('onboarding.paritySigner.noNewAccountLabel')}
            </p>
            <p className="text-neutral-variant text-sm">{t('onboarding.paritySigner.noNewAccountDescription')}</p>
          </div>
          <Button
            className="w-max mb-5"
            weight="lg"
            variant="fill"
            pallet="primary"
            onClick={() => setCameraState(CameraState.ACTIVE)}
          >
            {t('onboarding.paritySigner.scanAgainButton')}
          </Button>
        </div>
      )}
    </BaseModal>
  );
};

export default ScanMoreModal;
