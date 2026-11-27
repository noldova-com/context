import { type MigrationBuilder, SqlMigration } from "@noldova/context.data.sql";

export class ChangeOwnerKey extends SqlMigration {
  public constructor() {
    super("20261127140000_ChangeOwnerKey");
  }

  public override apply(builder: MigrationBuilder): void {
    builder.dropForeignKey("notes", "ownerId");
    builder.dropColumn("notes", "ownerId");
    builder.alterColumn("notes", "title", "TEXT");
    builder.alterColumn("notes", "rank", "TEXT");
    builder.dropPrimaryKey("owners");
    builder.dropColumn("owners", "id");
    builder.addColumn("owners", "code", "TEXT").hasDefaultValueSql("''");
    builder.addPrimaryKey("owners", "code");
  }
}
