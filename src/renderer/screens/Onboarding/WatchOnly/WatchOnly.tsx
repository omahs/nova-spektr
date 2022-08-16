import { ButtonBack } from '@renderer/components/ui';

const WatchOnly = () => {
  return (
    <>
      <div className="flex items-center gap-x-2.5">
        <ButtonBack />
        <h1 className="text-neutral">Add watch-only Wallet</h1>
      </div>
    </>
  );
};

export default WatchOnly;