/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ModelSnapshot, PropertyType, type SnapshotBuilder } from "@noldova/context.data";

export class BlogSnapshot extends ModelSnapshot {
  protected override buildModel(builder: SnapshotBuilder): void {
    builder.entity("Author")
      .property("id", PropertyType.Integer)
      .property("name", PropertyType.String)
      .collection("posts", "Post")
      .reference("profile", "Profile");
    builder.entity("Post")
      .property("id", PropertyType.Integer)
      .property("title", PropertyType.String)
      .optionalProperty("body", PropertyType.String)
      .property("authorId", PropertyType.Integer)
      .reference("author", "Author")
      .collection("tags", "Tag");
    builder.entity("Profile")
      .property("profileId", PropertyType.Integer)
      .property("authorId", PropertyType.Integer)
      .reference("author", "Author");
    builder.entity("Tag")
      .property("id", PropertyType.Integer)
      .property("label", PropertyType.String)
      .property("postId", PropertyType.Integer);
  }
}
