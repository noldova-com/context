/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import { Enumerable, type IReadOnlyDictionary, type IReadOnlyList, List } from "@noldova/context.collections";
import { JsonReader } from "@noldova/context.json";
import { SourcePosition } from "@noldova/context.parsers";

import { BuildHost } from "../../services/build-host.js";
import type { PositionMap } from "../models/position-map.js";
import type { SourceMapping } from "../models/source-mapping.js";
import { PluginResources } from "../plugin-resources.js";
import { Base64Vlq } from "./base64-vlq.js";
import { PluginHost } from "./plugin-host.js";

export class SourceMapComposer {
  public static async composeAsync(outputDirectory: string, maps: IReadOnlyDictionary<string, PositionMap>): Promise<void> {
    const files = await PluginHost.listFilesAsync(outputDirectory);
    for (const path of files.where(t => t.endsWith(PluginResources.sourceMapExtension))) {
      const composed = SourceMapComposer.composeMap(await BuildHost.readAsync(path), path, maps);
      if (!Object.isUndefined(composed))
        await PluginHost.writeAsync(path, composed);
    }
    for (const path of files.where(t => PluginResources.scriptExtensions.any(e => t.endsWith(e)))) {
      const text = await BuildHost.readAsync(path);
      const encoded = PluginResources.inlineSourceMapPattern.exec(text)?.[1];
      const composed = Object.isUndefined(encoded) ? undefined : SourceMapComposer.composeMap(PluginHost.decodeBase64(encoded), path, maps);
      if (!Object.isUndefined(composed))
        await PluginHost.writeAsync(path, text.replace(PluginResources.inlineSourceMapPattern, PluginResources.formatInlineSourceMap(PluginHost.encodeBase64(composed))));
    }
  }

  private static composeMap(text: string, path: string, maps: IReadOnlyDictionary<string, PositionMap>): string | undefined {
    const reader = JsonReader.parse(text, path);
    const folder = BuildHost.folderOf(path);
    const root = BuildHost.resolve(folder, reader.readOptionalString(PluginResources.sourceRootField) ?? "");
    const paths = Enumerable.from(reader.readStringArray(PluginResources.sourcesField)).select(t => BuildHost.resolve(root, t)).toList();
    if (!paths.any() || !paths.all(t => maps.containsKey(t)))
      return undefined;

    const sourceMaps = paths.select(t => maps.get(t)).toList();
    const sources = new List<string>();
    const lines = Base64Vlq.decode(reader.readString(PluginResources.mappingsField)).select(line => line.select(t => SourceMapComposer.compose(t, sourceMaps, sources)).toList()).toList();

    return JSON.stringify({
      version: reader.readInteger(PluginResources.versionField),
      file: reader.readOptionalString(PluginResources.fileField),
      sources: sources.select(t => PluginHost.relativePath(folder, t)).toArray(),
      names: reader.readStringArray(PluginResources.namesField),
      mappings: Base64Vlq.encode(lines)
    });
  }

  private static compose(mapping: SourceMapping, maps: IReadOnlyList<PositionMap>, sources: List<string>): SourceMapping {
    const map = maps.tryGet(mapping.sourceIndex);
    if (!mapping.hasSource || Object.isUndefined(map))
      return mapping;

    const original = map.originalOf(new SourcePosition(mapping.line, mapping.character));
    if (!sources.contains(original.path))
      sources.add(original.path);

    return mapping.withSource(sources.indexOf(original.path), original.position.lineIndex, original.position.characterIndex);
  }
}
