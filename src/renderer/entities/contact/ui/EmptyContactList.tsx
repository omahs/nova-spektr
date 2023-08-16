import { useNavigate } from 'react-router-dom';

import { BodyText, Button, Icon } from '@renderer/shared/ui';
import { Paths, useI18n } from '@renderer/app/providers';
import EmptyList from '@images/misc/empty-list.webp';

type Props = {
  description?: string;
  onNewContact?: () => void;
};
export const EmptyContactList = ({ description, onNewContact }: Props) => {
  const { t } = useI18n();
  const navigate = useNavigate();

  const navigateToNewContact = () => {
    if (onNewContact) {
      onNewContact();
    } else {
      navigate(Paths.CREATE_CONTACT);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-y-4 h-full">
      <img src={EmptyList} alt={t('addressBook.contactList.noContactsLabel')} width={178} height={178} />
      <BodyText className="text-text-tertiary">{description || t('addressBook.contactList.noContactsLabel')}</BodyText>

      <Button
        variant="text"
        className="h-4.5"
        suffixElement={<Icon size={16} name="add-address" />}
        onClick={navigateToNewContact}
      >
        {t('addressBook.createContact.addContactButton')}
      </Button>
    </div>
  );
};