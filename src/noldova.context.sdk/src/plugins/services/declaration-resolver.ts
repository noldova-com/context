/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import { Dictionary, Enumerable, HashSet, type IReadOnlyDictionary, type IReadOnlyList, List } from "@noldova/context.collections";
import { JsonReader } from "@noldova/context.json";
import { type Node, ValueNode } from "@noldova/context.parsers";
import {
  TypeScriptClassDeclarationNode,
  TypeScriptEnumDeclarationNode,
  TypeScriptExportDeclarationNode,
  TypeScriptExportSpecifierNode,
  TypeScriptFunctionDeclarationNode,
  TypeScriptImportDeclarationNode,
  TypeScriptImportSpecifierNode,
  TypeScriptInterfaceDeclarationNode,
  TypeScriptNamedExportsNode,
  TypeScriptNamedImportsNode,
  TypeScriptSourceKind,
  TypeScriptTypeAliasDeclarationNode,
  TypeScriptVariableDeclarationNode,
  TypeScriptVariableStatementNode
} from "@noldova/context.parsers.typescript";

import { Resources } from "../../resources.js";
import { BuildHost } from "../../services/build-host.js";
import { Declaration } from "../models/declaration.js";
import { NamedNode } from "../models/named-node.js";
import { SourceFile } from "../models/source-file.js";
import { PluginResources } from "../plugin-resources.js";
import { PluginHost } from "./plugin-host.js";

export class DeclarationResolver {
  private readonly manifestPath: string;
  private readonly sources: IReadOnlyDictionary<string, SourceFile>;
  private readonly declarationFiles: Dictionary<string, SourceFile | null> = new Dictionary<string, SourceFile | null>();

  public constructor(manifestPath: string, sources: IReadOnlyList<SourceFile>) {
    this.manifestPath = manifestPath;
    this.sources = sources.toDictionary(t => t.path, t => t);
  }

  public resolve(source: SourceFile, name: string): Declaration | undefined {
    return this.resolveIn(source, name, new HashSet<string>());
  }

  private resolveIn(source: SourceFile, name: string, seen: HashSet<string>): Declaration | undefined {
    return DeclarationResolver.localOf(source, name) ?? this.importedOf(source, name, seen);
  }

  private importedOf(source: SourceFile, name: string, seen: HashSet<string>): Declaration | undefined {
    for (const node of source.rootNode.children) {
      if (!(node instanceof TypeScriptImportDeclarationNode) || !(node.importClauseNode?.namedBindingsNode instanceof TypeScriptNamedImportsNode))
        continue;

      for (const specifier of node.importClauseNode.namedBindingsNode.children)
        if (specifier instanceof TypeScriptImportSpecifierNode && DeclarationResolver.valueOf(specifier.aliasNode ?? specifier.nameNode) === name)
          return this.exportedOf(this.moduleOf(source, node.moduleSpecifierNode), DeclarationResolver.valueOf(specifier.nameNode), seen);
    }

    return undefined;
  }

  private exportedOf(file: SourceFile | undefined, name: string, seen: HashSet<string>): Declaration | undefined {
    if (Object.isUndefined(file))
      return undefined;

    const key = `${file.path}${PluginResources.seenSeparator}${name}`;
    if (seen.contains(key))
      return undefined;

    seen.add(key);
    const local = DeclarationResolver.localOf(file, name);
    if (!Object.isUndefined(local))
      return local;

    for (const node of file.rootNode.children) {
      if (!(node instanceof TypeScriptExportDeclarationNode))
        continue;

      const target = Object.isUndefined(node.moduleSpecifierNode) ? undefined : this.moduleOf(file, node.moduleSpecifierNode);
      if (!(node.exportClauseNode instanceof TypeScriptNamedExportsNode)) {
        const declaration = Object.isUndefined(node.exportClauseNode.nameNode) ? this.exportedOf(target, name, seen) : undefined;
        if (!Object.isUndefined(declaration))
          return declaration;

        continue;
      }

      for (const specifier of node.exportClauseNode.children)
        if (specifier instanceof TypeScriptExportSpecifierNode && DeclarationResolver.valueOf(specifier.aliasNode ?? specifier.nameNode) === name)
          return Object.isUndefined(target)
            ? this.resolveIn(file, DeclarationResolver.valueOf(specifier.nameNode), seen)
            : this.exportedOf(target, DeclarationResolver.valueOf(specifier.nameNode), seen);
    }

    return undefined;
  }

  private moduleOf(file: SourceFile, specifierNode: Node): SourceFile | undefined {
    const specifier = DeclarationResolver.valueOf(specifierNode).slice(1, -1);
    if (specifier.startsWith(PluginResources.relativePrefix)) {
      const path = BuildHost.resolve(BuildHost.folderOf(file.path), specifier);

      return this.sources.tryGet(path.replace(PluginResources.compiledExtensionPattern, PluginResources.sourceExtension))
        ?? this.declarationFileOf(path.replace(PluginResources.compiledExtensionPattern, PluginResources.declarationExtension));
    }

    const segments = specifier.split(Resources.pathSeparator);
    const nameLength = specifier.startsWith(PluginResources.scopePrefix) ? 2 : 1;
    const root = PluginHost.packageRootOf(this.manifestPath, segments.slice(0, nameLength).join(Resources.pathSeparator));
    if (Object.isUndefined(root))
      return undefined;
    if (segments.length > nameLength)
      return this.declarationFileOf(PluginHost.join(root, ...segments.slice(nameLength)).replace(PluginResources.compiledExtensionPattern, PluginResources.declarationExtension));

    const types = JsonReader.parse(PluginHost.readSync(PluginHost.join(root, PluginResources.packageManifestFileName))).readOptionalString(PluginResources.typesField);

    return Object.isUndefined(types) ? undefined : this.declarationFileOf(BuildHost.resolve(root, types));
  }

  private declarationFileOf(path: string): SourceFile | undefined {
    let file = this.declarationFiles.tryGet(path);
    if (Object.isUndefined(file)) {
      const text = PluginHost.readOptionalSync(path);
      file = Object.isUndefined(text) ? null : SourceFile.parse(path, text, TypeScriptSourceKind.Declaration);
      this.declarationFiles.set(path, file);
    }

    return file ?? undefined;
  }

  private static localOf(source: SourceFile, name: string): Declaration | undefined {
    for (const node of source.rootNode.children)
      for (const named of DeclarationResolver.namedNodesOf(node))
        if (DeclarationResolver.valueOf(named.nameNode) === name)
          return new Declaration(name, source, named.node);

    return undefined;
  }

  private static namedNodesOf(node: Node): IReadOnlyList<NamedNode> {
    if (node instanceof TypeScriptClassDeclarationNode || node instanceof TypeScriptInterfaceDeclarationNode || node instanceof TypeScriptFunctionDeclarationNode
      || node instanceof TypeScriptEnumDeclarationNode || node instanceof TypeScriptTypeAliasDeclarationNode)
      return new List([new NamedNode(node, node.nameNode)]);
    if (node instanceof TypeScriptVariableStatementNode)
      return Enumerable.from(node.declarationListNode.children)
        .where((t): t is TypeScriptVariableDeclarationNode => t instanceof TypeScriptVariableDeclarationNode)
        .select(t => new NamedNode(t, t.nameNode))
        .toList();

    return new List<NamedNode>();
  }

  private static valueOf(node: Node | undefined): string {
    return node instanceof ValueNode ? node.value : "";
  }
}
