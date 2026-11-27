import { ModelSnapshot, PropertyType, type SnapshotBuilder } from "@noldova/context.data";

export class NotesContextModelSnapshot extends ModelSnapshot {
  protected override buildModel(builder: SnapshotBuilder): void {
    builder.entity("Note")
      .toTable("notes")
      .property("id", PropertyType.Integer)
      .optionalProperty("title", PropertyType.String)
      .optionalProperty("text", PropertyType.String, "body")
      .property("rank", PropertyType.Integer)
      .optionalProperty("ownerId", PropertyType.Integer)
      .hasKey("id")
      .hasForeignKey("Owner", "ownerId")
      .reference("owner", "Owner");
    builder.entity("Owner")
      .toTable("owners")
      .property("id", PropertyType.Integer)
      .property("name", PropertyType.String)
      .hasKey("id")
      .collection("notes", "Note");
  }
}
