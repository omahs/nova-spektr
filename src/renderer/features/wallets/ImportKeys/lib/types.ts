import { ChainId, HexString, KeyType } from '@renderer/shared/core';

type DerivationPropertyName = 'derivation_path' | 'type' | 'shaded';
type KeyProperties = { [key in DerivationPropertyName]: string | number };
export type ImportFileKey = { key: KeyProperties[] };
export type ImportFileChain = { [key: HexString]: ImportFileKey[] };
export type ParsedImportFile = {
  [key: HexString]: ImportFileChain;
  version: number;
};

export enum ValidationErrorsLabel {
  INVALID_FILE_STRUCTURE = 'dynamicDerivations.importKeys.error.invalidFile',
  INVALID_ROOT = 'dynamicDerivations.importKeys.error.invalidRoot',
  PASSWORD_PATH = 'dynamicDerivations.importKeys.error.invalidPasswordPath',
  INVALID_PATH = 'dynamicDerivations.importKeys.error.invalidPath',
}

export type ValidationError = {
  error: ValidationErrorsLabel;
  invalidPaths?: string[];
};

export type ImportedDerivation = {
  derivationPath?: string;
  chainId?: string;
  sharded?: string;
  type?: string;
};

export type TypedImportedDerivation = {
  derivationPath: string;
  type: KeyType;
  chainId: ChainId;
  sharded?: number;
};