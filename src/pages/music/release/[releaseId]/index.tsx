import MusicDetails from '@app/components/MusicDetails';
import type { MusicReleaseResult } from '@server/models/Music';
import axios from 'axios';
import type { GetServerSideProps, NextPage } from 'next';

interface ReleasePageProps {
  release?: MusicReleaseResult;
}

const ReleasePage: NextPage<ReleasePageProps> = ({ release }) => {
  return <MusicDetails release={release} />;
};

export const getServerSideProps: GetServerSideProps<ReleasePageProps> = async (
  ctx
) => {
  const response = await axios.get<MusicReleaseResult>(
    `http://${process.env.HOST || 'localhost'}:${
      process.env.PORT || 5055
    }/api/v1/music/release/${ctx.query.releaseId}`,
    {
      headers: ctx.req?.headers?.cookie
        ? { cookie: ctx.req.headers.cookie }
        : undefined,
    }
  );

  return {
    props: {
      release: response.data,
    },
  };
};

export default ReleasePage;
