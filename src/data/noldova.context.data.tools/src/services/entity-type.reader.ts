/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { List } from "@noldova/context.collections";
import "@noldova/context.core";
import { PropertyType } from "@noldova/context.data";
import { type Node, ValueNode } from "@noldova/context.parsers";
import {
  TypeScriptArrayTypeNode,
  TypeScriptLiteralTypeNode,
  TypeScriptNullKeywordNode,
  TypeScriptNumberKeywordNode,
  TypeScriptParenthesizedTypeNode,
  TypeScriptStringKeywordNode,
  TypeScriptTypeReferenceNode,
  TypeScriptUnionTypeNode
} from "@noldova/context.parsers.typescript";

import { DataToolsException } from "../exceptions/data-tools.exception.js";
import { EntityPropertyTypeException } from "../exceptions/entity-property-type.exception.js";
import { EntityShape } from "../models/shapes/entity-shape.js";
import { NavigationShape } from "../models/shapes/navigation-shape.js";
import { PropertyShape } from "../models/shapes/property-shape.js";
import type { SourceClass } from "../models/sources/source-class.js";
import type { SourceProperty } from "../models/sources/source-property.js";
import { Resources } from "../resources.js";

export class EntityTypeReader {
  private readonly classes: List<SourceClass>;
  private readonly entityNames: ReadonlySet<string>;

  private constructor(classes: readonly SourceClass[], entityNames: readonly string[]) {
    this.classes = new List(classes);
    this.entityNames = new Set(entityNames);
  }

  public static read(classes: readonly SourceClass[], entityNames: readonly string[]): readonly EntityShape[] {
    const reader = new EntityTypeReader(classes, entityNames);

    return entityNames.map(t => reader.readEntity(t));
  }

  private readEntity(name: string): EntityShape {
    const properties: PropertyShape[] = [];
    const navigations: NavigationShape[] = [];
    for (const property of this.chainOf(this.find(name)).flatMap(t => t.properties)) {
      const shape = this.readProperty(name, property);
      if (shape instanceof PropertyShape)
        properties.push(shape);
      else
        navigations.push(shape);
    }

    return new EntityShape(name, properties, navigations);
  }

  private find(name: string): SourceClass {
    const found = this.classes.where(t => t.name === name).toList();
    if (found.count() === 0)
      throw new DataToolsException(Resources.formatEntitySourceMissing(name));
    if (found.count() > 1)
      throw new DataToolsException(Resources.formatEntitySourceAmbiguous(name, found.select(t => t.filePath).toArray()));

    return found.get(0);
  }

  private chainOf(sourceClass: SourceClass): readonly SourceClass[] {
    const chain = [sourceClass];
    for (let base = this.findBase(sourceClass); !Object.isUndefined(base); base = this.findBase(base))
      chain.unshift(base);

    return chain;
  }

  private findBase(sourceClass: SourceClass): SourceClass | undefined {
    const bases = this.classes.where(t => t.name === sourceClass.baseName).toList();

    return bases.count() === 1 ? bases.get(0) : undefined;
  }

  private readProperty(entity: string, property: SourceProperty): PropertyShape | NavigationShape {
    if (Object.isUndefined(property.typeNode) || property.isOptional)
      throw new EntityPropertyTypeException(entity, property.name);

    const type = EntityTypeReader.unwrap(property.typeNode);
    const members = type instanceof TypeScriptUnionTypeNode ? type.children.map(t => EntityTypeReader.unwrap(t)) : [type];
    const valueTypes = members.filter(t => !EntityTypeReader.isNull(t));
    const isOptional = valueTypes.length < members.length;
    const valueType = valueTypes.length === 1 ? valueTypes[0] : undefined;

    if (valueType instanceof TypeScriptStringKeywordNode)
      return new PropertyShape(property.name, PropertyType.String, isOptional);
    if (valueType instanceof TypeScriptNumberKeywordNode)
      return new PropertyShape(property.name, PropertyType.Integer, isOptional);

    const reference = this.entityOf(valueType);
    if (isOptional && !Object.isNull(reference))
      return new NavigationShape(property.name, reference, false);

    const collection = valueType instanceof TypeScriptArrayTypeNode ? this.entityOf(EntityTypeReader.unwrap(valueType.elementTypeNode)) : null;
    if (!isOptional && !Object.isNull(collection))
      return new NavigationShape(property.name, collection, true);

    throw new EntityPropertyTypeException(entity, property.name);
  }

  private entityOf(type: Node | undefined): string | null {
    if (!(type instanceof TypeScriptTypeReferenceNode) || !Object.isUndefined(type.typeArgumentListNode) || !(type.nameNode instanceof ValueNode))
      return null;

    return this.entityNames.has(type.nameNode.value) ? type.nameNode.value : null;
  }

  private static unwrap(type: Node): Node {
    return type instanceof TypeScriptParenthesizedTypeNode ? EntityTypeReader.unwrap(type.typeNode) : type;
  }

  private static isNull(type: Node): boolean {
    return type instanceof TypeScriptNullKeywordNode || type instanceof TypeScriptLiteralTypeNode && type.literalNode instanceof TypeScriptNullKeywordNode;
  }
}
