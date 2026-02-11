import LoadingSpinner from '@app/components/Common/LoadingSpinner';
import PageTitle from '@app/components/Common/PageTitle';
import Tag from '@app/components/Common/Tag';
import defineMessages from '@app/utils/defineMessages';
import type { MusicArtistResult } from '@server/models/Music';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useIntl } from 'react-intl';
import useSWR from 'swr';

const messages = defineMessages('components.ArtistDetails', {
  discography: 'Discography',
  type: 'Type',
  country: 'Country',
  active: 'Active',
  disbanded: 'Disbanded',
  noreleases: 'No releases found.',
});

interface ArtistDetailsProps {
  artist?: MusicArtistResult;
}

const ArtistDetails = ({ artist }: ArtistDetailsProps) => {
  const router = useRouter();
  const intl = useIntl();

  const { data, error } = useSWR<MusicArtistResult>(
    `/api/v1/music/artist/${router.query.artistId}`,
    { fallbackData: artist }
  );

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  if (!data) {
    return <LoadingSpinner />;
  }

  return (
    <div className="media-page">
      <PageTitle title={data.name} />
      <div className="media-header">
        <div className="media-title">
          <h1 data-testid="media-title">
            {data.name}
            {data.disambiguation && (
              <span className="ml-2 text-lg text-gray-400">
                ({data.disambiguation})
              </span>
            )}
          </h1>
          <span className="media-attributes">
            {data.type && <Tag>{data.type}</Tag>}
            {data.country && <span>{data.country}</span>}
            {data.beginDate && (
              <span>
                {data.beginDate}
                {data.ended && data.endDate ? ` - ${data.endDate}` : ' - Present'}
              </span>
            )}
          </span>
        </div>
      </div>
      <div className="mt-6">
        <h2 className="text-xl font-bold text-white">
          {intl.formatMessage(messages.discography)}
        </h2>
        {data.releaseGroups.length === 0 ? (
          <p className="mt-4 text-gray-400">
            {intl.formatMessage(messages.noreleases)}
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {data.releaseGroups.map((rg) => (
              <Link
                key={rg.id}
                href={`/music/release-group/${rg.id}`}
                className="group flex flex-col rounded-lg bg-gray-800 p-3 ring-1 ring-gray-700 transition hover:ring-gray-500"
              >
                <div className="mb-2 truncate font-medium text-white group-hover:text-indigo-400">
                  {rg.title}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  {rg.primaryType && <Tag>{rg.primaryType}</Tag>}
                  {rg.firstReleaseDate && (
                    <span>{rg.firstReleaseDate.slice(0, 4)}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ArtistDetails;
