import { useMemo } from 'react';

import { RootExplorers, cnTw } from '@shared/lib/utils';
import { ContactItem } from '@entities/wallet';
import { useI18n } from '@app/providers';
import { FootnoteText, Token } from '@shared/ui';
import type { Chain, ChainAccount, ChainId, BaseAccount } from '@shared/core';
import { ChainTitle } from '@entities/chain';

type Props = {
  accounts: Map<BaseAccount, Record<ChainId, ChainAccount[]>>;
  chains: Chain[];
  className?: string;
};

export const MultishardAccountsList = ({ accounts, chains, className }: Props) => {
  const { t } = useI18n();

  const accountList = useMemo(() => {
    return [...accounts.entries()];
  }, []);

  return (
    <div className={cnTw('flex flex-col overflow-y-auto', className)}>
      {accountList.map(([baseAccount, chainMap]) => (
        <div key={baseAccount.id} className="flex flex-col pl-5 pr-2">
          <ContactItem
            className="sticky top-0 bg-white z-10 py-4"
            addressFont="text-text-secondary"
            size={28}
            name={baseAccount.name}
            accountId={baseAccount.accountId}
            explorers={RootExplorers}
          />

          <FootnoteText className="pl-10 text-text-tertiary">{t('accountList.addressColumn')}</FootnoteText>

          {chains.map((chain) => {
            if (!chainMap[chain.chainId]) return;

            return (
              <Token key={chain.chainId} isDefaultOpen className="pl-10">
                <Token.Button buttonClass="px-0">
                  <div className="flex gap-x-2">
                    <ChainTitle fontClass="text-text-primary" chain={chain} />
                    <FootnoteText className="text-text-tertiary">{chainMap[chain.chainId].length}</FootnoteText>
                  </div>
                </Token.Button>
                <Token.Content>
                  {chainMap[chain.chainId].map((account) => (
                    <div key={account.id} className="flex items-center py-1.5 mb-2">
                      <ContactItem
                        addressFont="text-text-secondary"
                        name={account.name}
                        accountId={account.accountId}
                        addressPrefix={chain.addressPrefix}
                        explorers={chain.explorers}
                      />
                    </div>
                  ))}

                  <hr className="border-divider my-1 w-full" />
                </Token.Content>
              </Token>
            );
          })}
        </div>
      ))}
    </div>
  );
};
