import { type MigrationBuilder, SqlMigration } from "@noldova/context.data.sql";

export class AddOwners extends SqlMigration {
  public constructor() {
    super("20261127130000_AddOwners");
  }

  public override apply(builder: MigrationBuilder): void {
    builder.dropTable("tags");
    builder.addColumn("notes", "title", "TEXT").makeNullable();
    builder.alterColumn("notes", "body", "TEXT").makeNullable();
    builder.addColumn("notes", "rank", "INTEGER").hasDefaultValueSql("0");
    builder.addColumn("notes", "ownerId", "INTEGER").makeNullable();
    builder.createTable("owners",
      table => {
        table.addColumn("id", "INTEGER");
        table.addColumn("name", "TEXT");
      },
      constraints => {
        constraints.addPrimaryKey("id");
      });
    builder.addForeignKey("notes", "ownerId", "owners", "id");
  }
}
