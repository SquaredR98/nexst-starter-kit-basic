import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1766681976324 implements MigrationInterface {
    name = 'InitialSchema1766681976324'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "profiles" ("user_id" uuid NOT NULL, "first_name" character varying(100), "last_name" character varying(100), "avatar_url" text, "phone" character varying(14), "phone_verified" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_9e432b7df0d182f8d292902d1a2" PRIMARY KEY ("user_id"))`);
        await queryRunner.query(`CREATE TABLE "permissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "resource" character varying(100) NOT NULL, "action" character varying(50) NOT NULL, "description" text, CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "role-permissions" ("role_id" uuid NOT NULL, "permission_id" uuid NOT NULL, "roleId" uuid, CONSTRAINT "PK_179bb27e5007da9d3a23c7a7034" PRIMARY KEY ("role_id", "permission_id"))`);
        await queryRunner.query(`CREATE TABLE "roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying(50) NOT NULL, "description" text, "parent_id" uuid, "priority" integer NOT NULL DEFAULT '0', CONSTRAINT "UQ_648e3f5447f725579d7d4ffdfb7" UNIQUE ("name"), CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_roles" ("user_id" uuid NOT NULL, "role_id" uuid NOT NULL, "assigned_by" uuid, "assigned_at" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, "roleId" uuid, CONSTRAINT "PK_23ed6f04fe43066df08379fd034" PRIMARY KEY ("user_id", "role_id"))`);
        await queryRunner.query(`CREATE TABLE "sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "refresh_token" text NOT NULL, "ip_address" character varying(100), "user_agent" character varying(500), "expires_at" TIMESTAMP NOT NULL, "revoked_at" TIMESTAMP, "last_active_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_c862499023be8feec98129d4e96" UNIQUE ("refresh_token"), CONSTRAINT "PK_3238ef96f18b355b671619111bc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_c862499023be8feec98129d4e9" ON "sessions" ("refresh_token") `);
        await queryRunner.query(`CREATE INDEX "IDX_085d540d9f418cfbdc7bd55bb1" ON "sessions" ("user_id") `);
        await queryRunner.query(`CREATE TABLE "oauth_accounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "provider" character varying(50) NOT NULL, "provider_account_id" character varying(500) NOT NULL, "access_token" text, "refresh_token" text, "expires_at" TIMESTAMP, "scope" character varying(500), "profile_data" jsonb, CONSTRAINT "PK_710a81523f515b78f894e33bb10" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_f1daab3d50d1ce730369c01c57" ON "oauth_accounts" ("provider", "provider_account_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_22a05e92f51a983475f9281d3b" ON "oauth_accounts" ("user_id") `);
        await queryRunner.query(`CREATE TABLE "two_factor" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "secret" text NOT NULL, "is_enabled" boolean NOT NULL DEFAULT false, "enabled_at" TIMESTAMP, "backup_codes" jsonb NOT NULL DEFAULT '[]', CONSTRAINT "UQ_162c7f53b41b84102a8e06eff18" UNIQUE ("user_id"), CONSTRAINT "REL_162c7f53b41b84102a8e06eff1" UNIQUE ("user_id"), CONSTRAINT "PK_d9e707ebc943c110fcaab7cdd8c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_162c7f53b41b84102a8e06eff1" ON "two_factor" ("user_id") `);
        await queryRunner.query(`CREATE TABLE "password_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "password_hash" character varying(255) NOT NULL, CONSTRAINT "PK_da65ed4600e5e6bc9315754a8b2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_4933dc7a01356ac0733a5ad52d" ON "password_history" ("user_id") `);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "email" character varying(255) NOT NULL, "email_verified" TIMESTAMP, "password_hash" character varying(255), "failed_attempts" integer NOT NULL DEFAULT '0', "locked_until" TIMESTAMP, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `);
        await queryRunner.query(`ALTER TABLE "profiles" ADD CONSTRAINT "FK_9e432b7df0d182f8d292902d1a2" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "role-permissions" ADD CONSTRAINT "FK_832f9475661d055310963d2f20d" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "role-permissions" ADD CONSTRAINT "FK_610246874a5f5e4d22972325a3b" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "roles" ADD CONSTRAINT "FK_3e97eeaf865aeda0d20c0c5c509" FOREIGN KEY ("parent_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_roles" ADD CONSTRAINT "FK_472b25323af01488f1f66a06b67" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_roles" ADD CONSTRAINT "FK_86033897c009fcca8b6505d6be2" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sessions" ADD CONSTRAINT "FK_085d540d9f418cfbdc7bd55bb19" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "oauth_accounts" ADD CONSTRAINT "FK_22a05e92f51a983475f9281d3b0" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "two_factor" ADD CONSTRAINT "FK_162c7f53b41b84102a8e06eff18" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "password_history" ADD CONSTRAINT "FK_4933dc7a01356ac0733a5ad52d9" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "password_history" DROP CONSTRAINT "FK_4933dc7a01356ac0733a5ad52d9"`);
        await queryRunner.query(`ALTER TABLE "two_factor" DROP CONSTRAINT "FK_162c7f53b41b84102a8e06eff18"`);
        await queryRunner.query(`ALTER TABLE "oauth_accounts" DROP CONSTRAINT "FK_22a05e92f51a983475f9281d3b0"`);
        await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT "FK_085d540d9f418cfbdc7bd55bb19"`);
        await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "FK_86033897c009fcca8b6505d6be2"`);
        await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "FK_472b25323af01488f1f66a06b67"`);
        await queryRunner.query(`ALTER TABLE "roles" DROP CONSTRAINT "FK_3e97eeaf865aeda0d20c0c5c509"`);
        await queryRunner.query(`ALTER TABLE "role-permissions" DROP CONSTRAINT "FK_610246874a5f5e4d22972325a3b"`);
        await queryRunner.query(`ALTER TABLE "role-permissions" DROP CONSTRAINT "FK_832f9475661d055310963d2f20d"`);
        await queryRunner.query(`ALTER TABLE "profiles" DROP CONSTRAINT "FK_9e432b7df0d182f8d292902d1a2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4933dc7a01356ac0733a5ad52d"`);
        await queryRunner.query(`DROP TABLE "password_history"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_162c7f53b41b84102a8e06eff1"`);
        await queryRunner.query(`DROP TABLE "two_factor"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_22a05e92f51a983475f9281d3b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f1daab3d50d1ce730369c01c57"`);
        await queryRunner.query(`DROP TABLE "oauth_accounts"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_085d540d9f418cfbdc7bd55bb1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c862499023be8feec98129d4e9"`);
        await queryRunner.query(`DROP TABLE "sessions"`);
        await queryRunner.query(`DROP TABLE "user_roles"`);
        await queryRunner.query(`DROP TABLE "roles"`);
        await queryRunner.query(`DROP TABLE "role-permissions"`);
        await queryRunner.query(`DROP TABLE "permissions"`);
        await queryRunner.query(`DROP TABLE "profiles"`);
    }

}
