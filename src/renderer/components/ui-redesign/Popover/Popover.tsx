import { Popover as Popup, Transition } from '@headlessui/react';
import { Fragment, PropsWithChildren, ReactNode, useLayoutEffect, useRef, useState } from 'react';
import cn from 'classnames';

export interface PopoverProps {
  content: ReactNode;
  offsetPx?: number;
  contentClass?: string;
}

const Popover = ({ content, children, offsetPx = 10, contentClass }: PropsWithChildren<PopoverProps>) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    setHeight(ref.current?.offsetHeight || 10); // with 0 here tests fail, so we need to provide some value
  }, []);

  return (
    <Popup className="relative">
      {height && (
        <Transition
          show={isOpen}
          as={Fragment}
          enter="transition ease-out duration-200"
          enterFrom="opacity-0 translate-y-1"
          enterTo="opacity-100 translate-y-0"
          leave="transition ease-in duration-150"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 translate-y-1"
        >
          <Popup.Panel
            id="popup"
            style={{ top: height + offsetPx + 'px' }}
            className="absolute z-20 rounded-md bg-white border border-redesign-gray-border shadow-popover"
          >
            <div className={cn('relative w-[275px]', contentClass)}>{content}</div>
          </Popup.Panel>
        </Transition>
      )}
      <div
        ref={ref}
        tabIndex={0}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        {children}
      </div>
    </Popup>
  );
};

export default Popover;
