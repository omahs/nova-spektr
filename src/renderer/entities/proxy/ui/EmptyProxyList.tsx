import { Icon, SmallTitleText, FootnoteText, Button } from '@shared/ui';
import { useI18n } from '@app/providers';
import { ProxyPopover } from './ProxyPopover';

export const EmptyProxyList = () => {
  const { t } = useI18n();

  return (
    <div className="flex flex-col items-center justify-center h-[376px]">
      <Icon name="emptyListFile" size={64} />
      <div className="flex items-center gap-x-1.5 mt-6 mb-2">
        <SmallTitleText>{t('walletDetails.common.emptyProxyTitle')}</SmallTitleText>
        <ProxyPopover />
      </div>
      <FootnoteText className="text-text-tertiary mb-4">{t('walletDetails.common.emptyProxyDesc')}</FootnoteText>
      <Button size="sm">{t('walletDetails.common.addProxyButton')}</Button>
    </div>
  );
};
