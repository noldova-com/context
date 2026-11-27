import { ModelSnapshot, PropertyType, type SnapshotBuilder } from "@noldova/context.data";

export class NotesContextModelSnapshot extends ModelSnapshot {
  protected override buildModel(builder: SnapshotBuilder): void {
    builder.entity("Note")
      .toTable("notes")
      .property("id", PropertyType.Integer)
      .property("text", PropertyType.String, "body")
      .hasKey("id");
    builder.entity("Tag")
      .toTable("tags")
      .property("id", PropertyType.Integer)
      .property("name", PropertyType.String)
      .hasKey("id");
  }
}
