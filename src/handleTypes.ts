import * as ts from "typescript";

export function getTypesAsString(
  givenFileName: string,
  givenTypeAliasName: string
) {
  const program = ts.createProgram([givenFileName], {
    target: ts.ScriptTarget.ES5,
    module: ts.ModuleKind.CommonJS,
    allowJs: true,
    checkJs: true,
    strictNullChecks: true,
  });
  const checker = program.getTypeChecker();

  const sourceFile = program.getSourceFile(givenFileName)!;

  function findTypeAliasInNamespace(
    node: ts.Node,
    typeAliasName: string
  ): ts.TypeAliasDeclaration | undefined {
    if (ts.isModuleDeclaration(node)) {
      //@ts-ignore
      const typeAlias = node.body.statements.find(
        // @ts-ignore
        (stmt) =>
          ts.isTypeAliasDeclaration(stmt) && stmt.name.text === typeAliasName
      );
      if (typeAlias) {
        return typeAlias;
      }
    }

    return ts.forEachChild(node, (child) =>
      findTypeAliasInNamespace(child, typeAliasName)
    );
  }

  function visit(node: ts.Node) {
    let namespaceName: string = "";
    try {
      if (ts.isModuleDeclaration(node)) {
        namespaceName = `${node.name.text}.`;
        const typeAlias = findTypeAliasInNamespace(node, givenTypeAliasName);
        if (typeAlias && ts.isTypeAliasDeclaration(typeAlias)) {
          node = typeAlias;
        }
      }

      if (ts.isTypeAliasDeclaration(node)) {
        const type = checker.getTypeAtLocation(node);
        const typeAliasName = node.name.escapedText;

        if (typeAliasName !== givenTypeAliasName) {
          return;
        }

        let types: string[] = [];

        if (type.isUnion()) {
          const unionTypes = type.types;
          for (const t of unionTypes) {
            let properties: string[] = [];
            t.getProperties().forEach((property) => {
              let propName = property.getName();
              let propType = checker.typeToString(
                checker.getTypeOfSymbolAtLocation(property, node),
                node,
                ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.InTypeAlias
              );
              let propOptional = "";

              if (property.getFlags() & ts.SymbolFlags.Optional) {
                propOptional = "?";
              }

              properties.push(`${propName}${propOptional}: ${propType};`);
            });

            const typeAliasTypesDefinition = properties.join(" ");
            types.push(`{ ${typeAliasTypesDefinition} }`);
          }
        } else {
          let properties: string[] = [];

          type.getProperties().forEach((property) => {
            let propName = property.getName();
            let propType = checker.typeToString(
              checker.getTypeOfSymbolAtLocation(property, node),
              node,
              ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.InTypeAlias
            );
            let propOptional = "";

            if (property.getFlags() & ts.SymbolFlags.Optional) {
              propOptional = "?";
            }

            properties.push(`${propName}${propOptional}: ${propType};`);
          });

          const typeAliasTypesDefinition = properties.join(" ");
          types.push(`{ ${typeAliasTypesDefinition} }`);
        }

        const typeAliasTypes = types.join(" | ");

        return `type ${namespaceName}${typeAliasName} = ${typeAliasTypes}`;
      }
    } catch (e) {
      //
    }
  }

  return ts.forEachChild(sourceFile!, visit);
}

export function formatTypeAliasMarkdown(typeAlias?: string): string {
  if (typeAlias === undefined) {
    return "";
  }

  const formattedTypeAlias = typeAlias
    .replace(/{\s*/, "{\n  ")
    .replace(/;\s*/g, ";\n  ")
    .replace(/,\s*/g, ",\n  ")
    .replace(/\n\s*\}/g, "\n}")
    .replace(/}\s*\|\s*{/g, "} | {\n ");

  return "```typescript\n" + formattedTypeAlias + "\n```";
}
