import { ApiPromise } from '@polkadot/api';

import { HexString } from '@renderer/domain/types';
import { Connection } from '../../storage';

// ------------------
// Service interfaces
// ------------------
export interface IChainService {
  getChainsData: () => Promise<Chain[]>;
}

export interface IChainSpecService {
  getChainSpec: (chainId: HexString) => Promise<string | undefined>;
  getKnownChain: (chainId: HexString) => string | undefined;
}

export interface INetworkService {
  connections: Record<string, ExtendedChain>;
  init: () => Promise<void>;
  reconnect: (chainId: HexString) => Promise<void>;
  updateConnectionType: (chainId: HexString, connectionType: ConnectionType) => Promise<void>;
}

// ------------------
// ----- Types ------
// ------------------

export const enum ConnectionType {
  LIGHT_CLIENT = 'LIGHT_CLIENT',
  RPC_NODE = 'RPC_NODE',
  DISABLED = 'DISABLED',
}

export type Asset = {
  assetId: number;
  symbol: string;
  precision: number;
  priceId: string;
};

export type RPCNode = {
  url: string;
  name: string;
};

export type Explorer = {
  name: string;
  extrinsic?: string;
  account?: string;
  event?: string;
};

export type ApiType = 'history';
export type HistoryType = 'subquery';

export type ExternalApi = {
  type: HistoryType;
  url: string;
};

export type Chain = {
  chainId: HexString;
  parentId: HexString;
  name: string;
  assets: Asset[];
  nodes: RPCNode[];
  explorers: Explorer[];
  color: string;
  icon: string;
  addressPrefix: number;
  externalApi: Record<ApiType, ExternalApi>;
};

export type ExtendedChain = Chain & {
  connection: Connection;
  api: ApiPromise;
};