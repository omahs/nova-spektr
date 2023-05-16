import { useEffect, useState } from 'react';
import { UnsignedTransaction } from '@substrate/txwrapper-polkadot';
import { BN } from '@polkadot/util';

import { BaseModal, Button } from '@renderer/components/ui-redesign';
import { useI18n } from '@renderer/context/I18nContext';
import { AccountDS, MultisigTransactionDS } from '@renderer/services/storage';
import { useToggle, useCountdown } from '@renderer/shared/hooks';
import { MultisigAccount } from '@renderer/domain/account';
import { ExtendedChain } from '@renderer/services/network/common/types';
import Chain from '../Chain';
import { Signing } from '../ActionSteps/Signing';
import { Scanning } from '../ActionSteps/Scanning';
import { Transaction, TransactionType } from '@renderer/domain/transaction';
import { Address, HexString, Timepoint } from '@renderer/domain/shared-kernel';
import { toAddress } from '@renderer/shared/utils/address';
import { getAssetById } from '@renderer/shared/utils/assets';
import { useAccount } from '@renderer/services/account/accountService';
import { getTransactionTitle } from '../../common/utils';
import { Submit } from '../ActionSteps/Submit';
import { useTransaction } from '@renderer/services/transaction/transactionService';
import { useBalance } from '@renderer/services/balance/balanceService';
import { transferableAmount } from '@renderer/shared/utils/balance';
import RejectReasonModal from './RejectReasonModal';
import { ChainFontStyle } from '@renderer/screens/Operations/components/modals/ApproveTx';
import Confirmation from '@renderer/screens/Operations/components/ActionSteps/Confirmation';
import { Icon } from '@renderer/components/ui';
import OperationResult from '@renderer/components/ui-redesign/OperationResult/OperationResult';

type Props = {
  tx: MultisigTransactionDS;
  account: MultisigAccount;
  connection: ExtendedChain;
};

const enum Step {
  CONFIRMATION,
  SCANNING,
  SIGNING,
  SUBMIT,
}

const AllSteps = [Step.CONFIRMATION, Step.SCANNING, Step.SIGNING, Step.SUBMIT];

const RejectTx = ({ tx, account, connection }: Props) => {
  const { t } = useI18n();
  const { getBalance } = useBalance();
  const { getLiveAccounts } = useAccount();
  const { getTransactionFee } = useTransaction();

  const [isModalOpen, toggleModal] = useToggle(false);
  const [isRejectReasonModalOpen, toggleRejectReasonModal] = useToggle(false);
  const [isFeeModalOpen, toggleFeeModal] = useToggle(false);
  const [countdown, resetCountdown] = useCountdown(connection.api);

  const [activeStep, setActiveStep] = useState(Step.CONFIRMATION);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectTx, setRejectTx] = useState<Transaction>();
  const [signature, setSignature] = useState<HexString>();
  const [unsignedTx, setUnsignedTx] = useState<UnsignedTransaction>();

  // if qr expires while on signing screen this state used as a flag for Scanning step to show qr error instead of generating new
  const [isQrExpired, setIsQrExpired] = useState(false);

  const accounts = getLiveAccounts();
  const signAccount = accounts.find((a) => a.accountId === tx.depositor);
  const transactionTitle = getTransactionTitle(tx.transaction);

  const goBack = () => {
    setActiveStep(AllSteps.indexOf(activeStep) - 1);
  };

  const onSignResult = (signature: HexString) => {
    setSignature(signature);
    toggleModal();
    setActiveStep(Step.SUBMIT);
  };

  const handleClose = () => {
    toggleModal();
    setActiveStep(Step.CONFIRMATION);
  };

  useEffect(() => {
    const multisigTx = getMultisigTx(signAccount?.accountId || account.signatories[0].accountId);

    setRejectTx(multisigTx);
  }, [tx, accounts.length, signAccount?.accountId]);

  const asset = getAssetById(tx.transaction?.args.assetId, connection.assets);

  const getMultisigTx = (signer: Address): Transaction => {
    const otherSignatories = account.signatories.reduce<Address[]>((acc, s) => {
      const signerAddress = toAddress(signer, { prefix: connection?.addressPrefix });
      const signatoryAddress = toAddress(s.accountId, { prefix: connection?.addressPrefix });

      if (signerAddress !== signatoryAddress) {
        acc.push(signatoryAddress);
      }

      return acc;
    }, []);

    return {
      chainId: tx.chainId,
      address: signer,
      type: TransactionType.MULTISIG_CANCEL_AS_MULTI,
      args: {
        threshold: account.threshold,
        otherSignatories: otherSignatories.sort(),
        callHash: tx.callHash,
        maybeTimepoint: {
          height: tx.blockCreated,
          index: tx.indexCreated,
        } as Timepoint,
      },
    };
  };

  const validateBalanceForFee = async (signAccount: AccountDS): Promise<boolean> => {
    if (!connection.api || !rejectTx || !signAccount.accountId || !asset) return false;

    const fee = await getTransactionFee(rejectTx, connection.api);
    const balance = await getBalance(signAccount.accountId, connection.chainId, asset.assetId.toString());

    if (!balance) return false;

    return new BN(fee).lte(new BN(transferableAmount(balance)));
  };

  const cancellable = tx.status === 'SIGNING' && signAccount;

  if (!cancellable) return <></>;

  const handleRejectReason = async (reason: string) => {
    const isValid = await validateBalanceForFee(signAccount);

    if (isValid) {
      setRejectReason(reason);
      setActiveStep(Step.SCANNING);
    } else {
      toggleFeeModal();
    }
  };

  const rejectTitle = (
    <div className="flex items-center py-1 ml-4">
      {t('operation.cancelTitle')} {t(transactionTitle)} {t('on')}
      <Chain className="ml-0.5" chainId={tx.chainId} fontProps={{ className: ChainFontStyle, fontWeight: 'bold' }} />
    </div>
  );

  const handleQrExpiredWhileSigning = () => {
    setIsQrExpired(true);
    goBack();
  };

  const handleQrReset = () => {
    resetCountdown();
    setIsQrExpired(false);
  };

  const isSubmitStep = activeStep === Step.SUBMIT && rejectTx && signAccount && signature && unsignedTx;

  return (
    <>
      <div className="flex justify-between">
        <Button size="sm" pallet="error" variant="fill" onClick={toggleModal}>
          {t('operation.rejectButton')}
        </Button>
      </div>

      <BaseModal
        isOpen={isModalOpen}
        closeButton
        title={rejectTitle}
        contentClass={activeStep === Step.SIGNING ? '' : undefined}
        onClose={handleClose}
      >
        {activeStep === Step.CONFIRMATION && (
          <>
            <Confirmation tx={tx} account={account} connection={connection} feeTx={rejectTx} />
            <Button
              className="mt-7 ml-auto"
              prefixElement={<Icon name="vault" size={14} />}
              onClick={toggleRejectReasonModal}
            >
              {t('operation.signButton')}
            </Button>
          </>
        )}
        {activeStep === Step.SCANNING && (
          <>
            {rejectTx && connection.api && signAccount && (
              <Scanning
                api={connection.api}
                chainId={tx.chainId}
                transaction={rejectTx}
                account={signAccount}
                explorers={connection?.explorers}
                addressPrefix={connection?.addressPrefix}
                countdown={countdown}
                isQrExpired={isQrExpired}
                onResetCountdown={handleQrReset}
                onResult={setUnsignedTx}
              />
            )}

            <div className="flex w-full justify-between">
              <Button variant="text" onClick={goBack}>
                {t('operation.goBackButton')}
              </Button>

              <Button onClick={() => setActiveStep(Step.SIGNING)}>{t('operation.continueButton')}</Button>
            </div>
          </>
        )}

        {activeStep === Step.SIGNING && (
          <div>
            {rejectTx && connection.api && signAccount && (
              <Signing
                api={connection.api}
                chainId={tx.chainId}
                transaction={rejectTx}
                countdown={countdown}
                assetId={asset?.assetId.toString() || '0'}
                onQrExpired={handleQrExpiredWhileSigning}
                onStartOver={() => {}}
                onResult={onSignResult}
              />
            )}
          </div>
        )}

        <RejectReasonModal
          isOpen={isRejectReasonModalOpen}
          onClose={toggleRejectReasonModal}
          onSubmit={handleRejectReason}
        />

        <OperationResult
          isOpen={isFeeModalOpen}
          title={t('operation.feeErrorTitle')}
          description={t('operation.feeErrorMessage')}
          onClose={toggleFeeModal}
        >
          <Button onClick={toggleFeeModal}>{t('operation.feeErrorButton')}</Button>
        </OperationResult>
      </BaseModal>

      {isSubmitStep && connection.api && (
        <Submit
          tx={rejectTx}
          api={connection.api}
          multisigTx={tx}
          matrixRoomId={account.matrixRoomId}
          account={signAccount}
          unsignedTx={unsignedTx}
          signature={signature}
          rejectReason={rejectReason}
        />
      )}
    </>
  );
};

export default RejectTx;