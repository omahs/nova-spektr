import { render, screen } from '@testing-library/react';

import { AccountAddress } from './AccountAddress';
import { TEST_ACCOUNT_ID, TEST_ADDRESS } from '@renderer/shared/lib/utils';

jest.mock('@renderer/entities/walletConnect', () => ({
  wcModel: { events: {} },
  DEFAULT_POLKADOT_METHODS: {},
  getWalletConnectChains: jest.fn(),
}));
jest.mock('@renderer/pages/Onboarding/WalletConnect/model/wc-onboarding-model', () => ({
  wcOnboardingModel: { events: {} },
}));

describe('ui/AccountAddress', () => {
  test('should render component', () => {
    render(<AccountAddress accountId={TEST_ACCOUNT_ID} addressPrefix={0} />);

    const addressValue = screen.getByText(TEST_ADDRESS);
    expect(addressValue).toBeInTheDocument();
  });

  test('should render short component', () => {
    render(<AccountAddress type="short" accountId={TEST_ACCOUNT_ID} />);

    const elipsis = screen.getByText('5CGQ7B...VbXyr9');
    expect(elipsis).toBeInTheDocument();
  });
});