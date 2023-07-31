import { UnsignedTransaction } from '@substrate/txwrapper-polkadot';
import { useEffect, useState, ComponentProps } from 'react';
import { ApiPromise } from '@polkadot/api';
import { useNavigate } from 'react-router-dom';

import { useI18n } from '@renderer/context/I18nContext';
import { HexString } from '@renderer/domain/shared-kernel';
import { useTransaction } from '@renderer/services/transaction/transactionService';
import { ExtrinsicResultParams } from '@renderer/services/transaction/common/types';
import { isMultisig, Account, MultisigAccount } from '@renderer/domain/account';
import { toAccountId } from '@renderer/shared/utils/address';
import { useMatrix } from '@renderer/context/MatrixContext';
import { Button } from '@renderer/components/ui-redesign';
import { OperationResult } from '@renderer/components/common/OperationResult/OperationResult';
import { useToggle } from '@renderer/shared/hooks';
import { useMultisigTx } from '@renderer/services/multisigTx/multisigTxService';
import { DEFAULT_TRANSITION } from '@renderer/shared/utils/constants';
import Paths from '@renderer/routes/paths';
import { Transaction, MultisigEvent, MultisigTransaction, MultisigTxInitStatus } from '@renderer/domain/transaction';
import { useMultisigEvent } from '@renderer/services/multisigEvent/multisigEventService';
import { useMultisigChainContext } from '@renderer/context/MultisigChainContext';

type ResultProps = Pick<ComponentProps<typeof OperationResult>, 'title' | 'description' | 'variant'>;

// TODO: Looks very similar to ActionSteps/Submit.tsx

type Props = {
  api: ApiPromise;
  accounts: Array<Account | MultisigAccount>;
  txs: Transaction[];
  multisigTx?: Transaction;
  unsignedTx: UnsignedTransaction[];
  signatures: HexString[];
  description?: string;
  onClose: () => void;
};

export const Submit = ({ api, accounts, txs, multisigTx, unsignedTx, signatures, description, onClose }: Props) => {
  const { t } = useI18n();
  const navigate = useNavigate();

  const { matrix } = useMatrix();
  const { submitAndWatchExtrinsic, getSignedExtrinsic } = useTransaction();
  const { addTask } = useMultisigChainContext();

  const { addMultisigTx } = useMultisigTx({ addTask });
  const { addEventWithQueue } = useMultisigEvent({ addTask });

  const [isSuccess, toggleSuccessMessage] = useToggle();
  const [inProgress, toggleInProgress] = useToggle(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    submitExtrinsic(signatures).catch(() => console.warn('Error getting signed extrinsics'));
  }, []);

  const handleSuccessClose = () => {
    if (isMultisig(accounts[0]) && isSuccess) {
      setTimeout(() => navigate(Paths.OPERATIONS), DEFAULT_TRANSITION);
    } else {
      setTimeout(() => navigate(Paths.STAKING), DEFAULT_TRANSITION);
    }

    onClose();
  };

  const submitExtrinsic = async (signatures: HexString[]): Promise<void> => {
    const extrinsicRequests = unsignedTx.map((unsigned, index) => {
      return getSignedExtrinsic(unsigned, signatures[index], api);
    });

    const allExtrinsics = await Promise.all(extrinsicRequests);

    allExtrinsics.forEach((extrinsic, index) => {
      submitAndWatchExtrinsic(extrinsic, unsignedTx[index], api, async (executed, params) => {
        console.warn('⛩️ Unsigned transaction from submit:');
        for (const param in unsignedTx) {
          if (Object.prototype.hasOwnProperty.call(unsignedTx, param)) {
            const key: keyof typeof unsignedTx = param as any;
            console.warn(`⛩️ ${String(key)}: ${unsignedTx[key as keyof typeof unsignedTx]}`);
          }
        }
        console.warn(`⛩️ Signature from submit: ${unsignedTx[index]}`);
        if (executed) {
          const mstAccount = accounts[0];
          const typedParams = params as ExtrinsicResultParams;

          if (multisigTx && isMultisig(mstAccount)) {
            const newTx: MultisigTransaction = {
              accountId: mstAccount.accountId,
              chainId: multisigTx.chainId,
              signatories: mstAccount.signatories,
              callData: multisigTx.args.callData,
              callHash: multisigTx.args.callHash,
              transaction: txs[index],
              status: MultisigTxInitStatus.SIGNING,
              blockCreated: typedParams.timepoint.height,
              indexCreated: typedParams.timepoint.index,
              description,
              dateCreated: Date.now(),
            };

            const event: MultisigEvent = {
              txAccountId: newTx.accountId,
              txChainId: newTx.chainId,
              txCallHash: newTx.callHash,
              txBlock: newTx.blockCreated,
              txIndex: newTx.indexCreated,
              status: 'SIGNED',
              accountId: toAccountId(multisigTx.address),
              extrinsicHash: typedParams.extrinsicHash,
              eventBlock: typedParams.timepoint.height,
              eventIndex: typedParams.timepoint.index,
              dateCreated: Date.now(),
            };

            await Promise.all([addMultisigTx(newTx), addEventWithQueue(event)]);

            if (matrix.userIsLoggedIn) {
              sendMultisigEvent(mstAccount.matrixRoomId, newTx, typedParams);
            }
          }

          toggleSuccessMessage();
          setTimeout(() => {
            onClose();

            if (isMultisig(mstAccount)) {
              setTimeout(() => navigate(Paths.OPERATIONS), DEFAULT_TRANSITION);
            } else {
              setTimeout(() => navigate(Paths.STAKING), DEFAULT_TRANSITION);
            }
          }, 2000);
        } else {
          setErrorMessage(params as string);
        }

        toggleInProgress();
      });
    });
  };

  const sendMultisigEvent = (matrixRoomId: string, updatedTx: MultisigTransaction, params: ExtrinsicResultParams) => {
    if (!multisigTx) return;

    matrix
      .sendApprove(matrixRoomId, {
        senderAccountId: toAccountId(multisigTx.address),
        chainId: updatedTx.chainId,
        callHash: updatedTx.callHash,
        callData: updatedTx.callData,
        extrinsicTimepoint: params.timepoint,
        extrinsicHash: params.extrinsicHash,
        error: Boolean(params.multisigError),
        description,
        callTimepoint: {
          height: updatedTx.blockCreated || params.timepoint.height,
          index: updatedTx.indexCreated || params.timepoint.index,
        },
      })
      .catch(console.warn);
  };

  const getSuccessMessage = (): string => {
    if (multisigTx) return t('staking.submitSuccessMultisig');
    if (accounts.length === 1) return t('staking.submitSuccessSingle');

    return t('staking.submitSuccessMultishard');
  };

  const closeErrorMessage = () => {
    onClose();
    setErrorMessage('');
  };

  const getResultProps = (): ResultProps => {
    if (inProgress) {
      return { title: t('operation.inProgress'), variant: 'loading' };
    }
    if (isSuccess) {
      return { title: getSuccessMessage(), variant: 'success' };
    }
    if (errorMessage) {
      return { title: t('operation.feeErrorTitle'), description: errorMessage, variant: 'error' };
    }

    return { title: '' };
  };

  return (
    <OperationResult
      isOpen={Boolean(inProgress || errorMessage || isSuccess)}
      {...getResultProps()}
      onClose={handleSuccessClose}
    >
      {errorMessage && <Button onClick={closeErrorMessage}>{t('operation.feeErrorButton')}</Button>}
    </OperationResult>
  );
};
