import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBookMusicSupport1781000000000 implements MigrationInterface {
  name = 'AddBookMusicSupport1781000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "media" ADD COLUMN "googleBooksId" varchar`
    );
    await queryRunner.query(
      `ALTER TABLE "media" ADD COLUMN "musicBrainzId" varchar`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_media_googleBooksId" ON "media" ("googleBooksId")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_media_musicBrainzId" ON "media" ("musicBrainzId")`
    );
    await queryRunner.query(
      `ALTER TABLE "media_request" ADD COLUMN "isAudiobook" boolean NOT NULL DEFAULT false`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_media_googleBooksId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_media_musicBrainzId"`);

    await queryRunner.query(
      `ALTER TABLE "media" DROP COLUMN "googleBooksId"`
    );
    await queryRunner.query(
      `ALTER TABLE "media" DROP COLUMN "musicBrainzId"`
    );
    await queryRunner.query(
      `ALTER TABLE "media_request" DROP COLUMN "isAudiobook"`
    );
  }
}
