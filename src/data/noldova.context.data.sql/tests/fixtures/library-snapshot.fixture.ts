/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ModelSnapshot, PropertyType, type SnapshotBuilder } from "@noldova/context.data";

export class LibrarySnapshot extends ModelSnapshot {
  protected override buildModel(builder: SnapshotBuilder): void {
    builder.entity("Writer")
      .property("id", PropertyType.Integer)
      .property("name", PropertyType.String)
      .optionalProperty("bio", PropertyType.String);
    builder.entity("Book")
      .property("id", PropertyType.Integer)
      .property("title", PropertyType.String)
      .property("writerId", PropertyType.Integer)
      .reference("writer", "Writer");
  }
}
