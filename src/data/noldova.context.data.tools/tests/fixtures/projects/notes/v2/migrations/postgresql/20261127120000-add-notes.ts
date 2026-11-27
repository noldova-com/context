import { type MigrationBuilder, SqlMigration } from "@noldova/context.data.sql";

export class AddNotes extends SqlMigration {
  public constructor() {
    super("20261127120000_AddNotes");
  }

  public override apply(builder: MigrationBuilder): void {
    builder.createTable("notes",
      table => {
        table.addColumn("id", "BIGINT");
        table.addColumn("body", "TEXT");
      },
      constraints => {
        constraints.addPrimaryKey("id");
      });
    builder.createTable("tags",
      table => {
        table.addColumn("id", "BIGINT");
        table.addColumn("name", "TEXT");
      },
      constraints => {
        constraints.addPrimaryKey("id");
      });
  }
}
