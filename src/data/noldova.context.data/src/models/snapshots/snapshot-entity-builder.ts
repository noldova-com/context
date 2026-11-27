/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { List } from "@noldova/context.collections";

import type { PropertyType } from "../../enums/property-type.js";
import { SnapshotEntity } from "./snapshot-entity.js";
import { SnapshotNavigation } from "./snapshot-navigation.js";
import { SnapshotProperty } from "./snapshot-property.js";

export class SnapshotEntityBuilder {
  private readonly name: string;
  private readonly properties: List<SnapshotProperty> = new List();
  private readonly navigations: List<SnapshotNavigation> = new List();

  public constructor(name: string) {
    this.name = name;
  }

  public property(name: string, type: PropertyType): this {
    this.properties.add(new SnapshotProperty(name, type, false));

    return this;
  }

  public optionalProperty(name: string, type: PropertyType): this {
    this.properties.add(new SnapshotProperty(name, type, true));

    return this;
  }

  public reference(name: string, target: string): this {
    this.navigations.add(new SnapshotNavigation(name, target, false));

    return this;
  }

  public collection(name: string, target: string): this {
    this.navigations.add(new SnapshotNavigation(name, target, true));

    return this;
  }

  public toEntity(): SnapshotEntity {
    return new SnapshotEntity(this.name, this.properties, this.navigations);
  }
}
