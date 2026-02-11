import Button from '@app/components/Common/Button';
import CachedImage from '@app/components/Common/CachedImage';
import LoadingSpinner from '@app/components/Common/LoadingSpinner';
import PageTitle from '@app/components/Common/PageTitle';
import Tag from '@app/components/Common/Tag';
import RequestModal from '@app/components/RequestModal';
import StatusBadge from '@app/components/StatusBadge';
import { Permission, useUser } from '@app/hooks/useUser';
import globalMessages from '@app/i18n/globalMessages';
import defineMessages from '@app/utils/defineMessages';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { MediaStatus } from '@server/constants/media';
import type { MusicReleaseResult } from '@server/models/Music';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useState } from 'react';
import { useIntl } from 'react-intl';
import useSWR from 'swr';

const messages = defineMessages('components.MusicDetails', {
  overview: 'Overview',
  requestalbum: 'Request Album',
  tracks: '{count, plural, one {# Track} other {# Tracks}}',
  releasetype: 'Type',
  releasedate: 'Release Date',
  label: '{labelCount, plural, one {Label} other {Labels}}',
  country: 'Country',
  artist: 'Artist',
  status: 'Status',
});

interface MusicDetailsProps {
  release?: MusicReleaseResult;
}

const MusicDetails = ({ release }: MusicDetailsProps) => {
  const router = useRouter();
  const intl = useIntl();
  const { hasPermission } = useUser();
  const [showRequestModal, setShowRequestModal] = useState(false);

  const { data, error, mutate: revalidate } = useSWR<MusicReleaseResult>(
    `/api/v1/music/release/${router.query.releaseId}`,
    { fallbackData: release }
  );

  const onRequestComplete = useCallback(
    (newStatus: MediaStatus) => {
      revalidate();
      setShowRequestModal(false);
    },
    [revalidate]
  );

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  if (!data) {
    return <LoadingSpinner />;
  }

  const showRequestButton = hasPermission(
    [Permission.REQUEST, Permission.REQUEST_MUSIC],
    { type: 'or' }
  );

  return (
    <div
      className="media-page"
      style={{
        height: 493,
      }}
    >
      <RequestModal
        show={showRequestModal}
        type="music"
        externalId={data.id}
        onComplete={onRequestComplete}
        onCancel={() => setShowRequestModal(false)}
      />
      {data.coverUrl && (
        <div className="media-page-bg-image">
          <CachedImage
            alt=""
            src={data.coverUrl}
            type="external"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            fill
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(180deg, rgba(17, 24, 39, 0.47) 0%, rgba(17, 24, 39, 1) 100%)',
            }}
          />
        </div>
      )}
      <PageTitle title={data.title} />
      <div className="media-header">
        <div className="media-poster">
          <CachedImage
            src={
              data.coverUrl ?? '/images/seerr_poster_not_found_logo_top.png'
            }
            alt=""
            type="external"
            className="rounded-lg shadow-md"
            style={{ width: '100%', height: 'auto' }}
            width={300}
            height={300}
          />
        </div>
        <div className="media-title">
          <div className="media-status">
            {data.mediaInfo?.status && data.mediaInfo.status !== MediaStatus.UNKNOWN && (
              <StatusBadge
                status={data.mediaInfo.status}
                inProgress={
                  (data.mediaInfo?.downloadStatus ?? []).length > 0
                }
              />
            )}
          </div>
          <h1 data-testid="media-title">
            {data.title}
            {data.releaseDate && (
              <span className="media-year">
                ({data.releaseDate.slice(0, 4)})
              </span>
            )}
          </h1>
          <span className="media-attributes">
            {data.artistName && (
              <span>
                {data.artistId ? (
                  <Link
                    href={`/music/artist/${data.artistId}`}
                    className="hover:underline"
                  >
                    {data.artistName}
                  </Link>
                ) : (
                  data.artistName
                )}
              </span>
            )}
            {data.trackCount && (
              <span>
                {intl.formatMessage(messages.tracks, {
                  count: data.trackCount,
                })}
              </span>
            )}
            {data.releaseType && <Tag>{data.releaseType}</Tag>}
          </span>
        </div>
      </div>
      <div className="media-overview">
        <div className="media-overview-left">
          {showRequestButton &&
            (!data.mediaInfo?.status ||
              data.mediaInfo.status === MediaStatus.UNKNOWN) && (
              <div className="mb-6">
                <Button
                  buttonType="primary"
                  onClick={() => setShowRequestModal(true)}
                >
                  <ArrowDownTrayIcon />
                  <span>{intl.formatMessage(messages.requestalbum)}</span>
                </Button>
              </div>
            )}
        </div>
        <div className="media-overview-right">
          <div className="media-facts">
            {data.artistName && (
              <div className="media-fact">
                <span>{intl.formatMessage(messages.artist)}</span>
                <span className="media-fact-value">
                  {data.artistId ? (
                    <Link
                      href={`/music/artist/${data.artistId}`}
                      className="hover:underline"
                    >
                      {data.artistName}
                    </Link>
                  ) : (
                    data.artistName
                  )}
                </span>
              </div>
            )}
            {data.releaseDate && (
              <div className="media-fact">
                <span>{intl.formatMessage(messages.releasedate)}</span>
                <span className="media-fact-value">{data.releaseDate}</span>
              </div>
            )}
            {data.releaseType && (
              <div className="media-fact">
                <span>{intl.formatMessage(messages.releasetype)}</span>
                <span className="media-fact-value">{data.releaseType}</span>
              </div>
            )}
            {data.country && (
              <div className="media-fact">
                <span>{intl.formatMessage(messages.country)}</span>
                <span className="media-fact-value">{data.country}</span>
              </div>
            )}
            {data.labels.length > 0 && (
              <div className="media-fact">
                <span>
                  {intl.formatMessage(messages.label, {
                    labelCount: data.labels.length,
                  })}
                </span>
                <span className="media-fact-value">
                  {data.labels.join(', ')}
                </span>
              </div>
            )}
            {data.status && (
              <div className="media-fact">
                <span>{intl.formatMessage(messages.status)}</span>
                <span className="media-fact-value">{data.status}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicDetails;
