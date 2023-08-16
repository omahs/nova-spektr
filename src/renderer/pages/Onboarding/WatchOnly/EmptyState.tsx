import { BodyText } from '@renderer/shared/ui';
import { useI18n } from '@renderer/app/providers';
import EmptyList from '@images/misc/empty-list.webp';

const EmptyState = () => {
  const { t } = useI18n();

  return (
    <div className="flex flex-col items-center justify-center gap-4 h-full">
      <img src={EmptyList} alt={t('addressBook.contactList.noContactsLabel')} width={178} height={178} />
      <BodyText className="text-text-tertiary w-[300px] text-center">{t('onboarding.watchOnly.emptyState')}</BodyText>
    </div>
  );
};

export default EmptyState;