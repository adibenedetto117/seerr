import Header from '@app/components/Common/Header';
import ListView from '@app/components/Common/ListView';
import PageTitle from '@app/components/Common/PageTitle';
import useDiscover from '@app/hooks/useDiscover';
import { useUpdateQueryParams } from '@app/hooks/useUpdateQueryParams';
import Error from '@app/pages/_error';
import defineMessages from '@app/utils/defineMessages';
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import type { MusicReleaseGroupResult } from '@server/models/Music';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useIntl } from 'react-intl';

const messages = defineMessages('components.Discover.DiscoverMusic', {
  discovermusic: 'Music',
  searchplaceholder: 'Search music...',
});

const typeOptions = [
  { value: 'type:album AND status:official', label: 'Albums' },
  { value: 'type:single AND status:official', label: 'Singles' },
  { value: 'type:ep AND status:official', label: 'EPs' },
  { value: 'type:album', label: 'All Albums' },
] as const;

interface MusicFilterOptions {
  query?: string;
  page?: number;
}

const DiscoverMusic = () => {
  const intl = useIntl();
  const router = useRouter();
  const updateQueryParams = useUpdateQueryParams({});

  const currentQuery =
    (router.query.query as string) || 'type:album AND status:official';
  const [searchInput, setSearchInput] = useState('');

  const {
    isLoadingInitialData,
    isEmpty,
    isLoadingMore,
    isReachingEnd,
    titles,
    fetchMore,
    error,
  } = useDiscover<MusicReleaseGroupResult, unknown, MusicFilterOptions>(
    '/api/v1/discover/music',
    { query: currentQuery }
  );

  if (error) {
    return <Error statusCode={500} />;
  }

  const title = intl.formatMessage(messages.discovermusic);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      updateQueryParams('query', searchInput.trim());
    }
  };

  return (
    <>
      <PageTitle title={title} />
      <div className="mb-4 flex flex-col justify-between lg:flex-row lg:items-end">
        <Header>{title}</Header>
        <div className="mt-2 flex flex-grow flex-col sm:flex-row lg:flex-grow-0">
          <form
            onSubmit={handleSearch}
            className="mb-2 flex flex-grow sm:mb-0 sm:mr-2 lg:flex-grow-0"
          >
            <span className="inline-flex cursor-default items-center rounded-l-md border border-r-0 border-gray-500 bg-gray-800 px-3 text-gray-100 sm:text-sm">
              <MagnifyingGlassIcon className="h-6 w-6" />
            </span>
            <input
              type="text"
              className="rounded-r-only"
              placeholder={intl.formatMessage(messages.searchplaceholder)}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </form>
          <div className="mb-2 flex flex-grow sm:mb-0 lg:flex-grow-0">
            <select
              className="rounded-only"
              value={currentQuery}
              onChange={(e) => updateQueryParams('query', e.target.value)}
            >
              {typeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <ListView
        items={titles}
        isEmpty={isEmpty}
        isLoading={
          isLoadingInitialData || (isLoadingMore && (titles?.length ?? 0) > 0)
        }
        isReachingEnd={isReachingEnd}
        onScrollBottom={fetchMore}
      />
    </>
  );
};

export default DiscoverMusic;
