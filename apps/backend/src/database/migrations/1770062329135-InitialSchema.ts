import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1770062329135 implements MigrationInterface {
    name = 'InitialSchema1770062329135'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "role-permissions" DROP CONSTRAINT "FK_832f9475661d055310963d2f20d"`);
        await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "FK_472b25323af01488f1f66a06b67"`);
        await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "FK_86033897c009fcca8b6505d6be2"`);
        await queryRunner.query(`ALTER TABLE "role-permissions" DROP COLUMN "roleId"`);
        await queryRunner.query(`ALTER TABLE "user_roles" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "user_roles" DROP COLUMN "roleId"`);
        await queryRunner.query(`ALTER TABLE "role-permissions" ADD CONSTRAINT "FK_26bae4b3d48e2454b112bf1c994" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_roles" ADD CONSTRAINT "FK_87b8888186ca9769c960e926870" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_roles" ADD CONSTRAINT "FK_b23c65e50a758245a33ee35fda1" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "FK_b23c65e50a758245a33ee35fda1"`);
        await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "FK_87b8888186ca9769c960e926870"`);
        await queryRunner.query(`ALTER TABLE "role-permissions" DROP CONSTRAINT "FK_26bae4b3d48e2454b112bf1c994"`);
        await queryRunner.query(`ALTER TABLE "user_roles" ADD "roleId" uuid`);
        await queryRunner.query(`ALTER TABLE "user_roles" ADD "userId" uuid`);
        await queryRunner.query(`ALTER TABLE "role-permissions" ADD "roleId" uuid`);
        await queryRunner.query(`ALTER TABLE "user_roles" ADD CONSTRAINT "FK_86033897c009fcca8b6505d6be2" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_roles" ADD CONSTRAINT "FK_472b25323af01488f1f66a06b67" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "role-permissions" ADD CONSTRAINT "FK_832f9475661d055310963d2f20d" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
