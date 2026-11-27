import { ModelSnapshot, PropertyType, type SnapshotBuilder } from "@noldova/context.data";

export class NotesContextModelSnapshot extends ModelSnapshot {
  protected override buildModel(builder: SnapshotBuilder): void {
    builder.entity("Note")
      .toTable("notes")
      .property("id", PropertyType.Integer)
      .property("title", PropertyType.String)
      .optionalProperty("text", PropertyType.String, "body")
      .property("rank", PropertyType.String)
      .hasKey("id");
    builder.entity("Owner")
      .toTable("owners")
      .property("code", PropertyType.String)
      .property("name", PropertyType.String)
      .hasKey("code");
  }
}
