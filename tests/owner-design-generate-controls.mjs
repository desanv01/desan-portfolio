// Development-only AST reader: refresh checked-in control data when the closed schema changes.
import ts from 'typescript';
import fs from 'node:fs';
const source = ts.createSourceFile(
  'schema.ts',
  fs.readFileSync('src/design/schema.ts', 'utf8'),
  ts.ScriptTarget.Latest,
  true,
);
const declarations = new Map();
for (const statement of source.statements)
  if (ts.isVariableStatement(statement))
    for (const d of statement.declarationList.declarations)
      if (ts.isIdentifier(d.name)) declarations.set(d.name.text, d.initializer);
const num = (min = -1e7, max = 1e7, integer = false) => ({
  kind: 'number',
  min,
  max,
  integer,
});
const special = {
  text: { kind: 'text' },
  id: { kind: 'id' },
  bool: { kind: 'boolean' },
  color: { kind: 'color' },
  tag: { kind: 'id' },
};
function literal(n) {
  if (ts.isStringLiteral(n)) return n.text;
  if (ts.isNumericLiteral(n)) return Number(n.text);
  if (n.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (n.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (ts.isPrefixUnaryExpression(n)) return -literal(n.operand);
  throw Error('Unsupported literal ' + n.getText(source));
}
function object(n) {
  return Object.fromEntries(
    n.properties.map((p) => [
      p.name.text,
      read(ts.isShorthandPropertyAssignment(p) ? p.name : p.initializer),
    ]),
  );
}
function read(n) {
  if (ts.isIdentifier(n)) {
    if (special[n.text]) return special[n.text];
    if (n.text === 'nonnegativeMeasure') {
      const c = read(declarations.get('measure'));
      c.required.value = num(0);
      return c;
    }
    if (!declarations.has(n.text)) throw Error('Unknown ' + n.text);
    return read(declarations.get(n.text));
  }
  if (ts.isObjectLiteralExpression(n)) return object(n);
  if (ts.isCallExpression(n)) {
    const name = n.expression.getText(source),
      a = n.arguments;
    if (name === 'num') return num(...a.map(literal));
    if (name === 'choice') return { kind: 'choice', options: a.map(literal) };
    if (name === 'either') return { kind: 'union', options: a.map(read) };
    if (name === 'shape')
      return {
        kind: 'object',
        required: object(a[0]),
        optional: a[1] ? object(a[1]) : {},
      };
    if (name === 'array')
      return {
        kind: 'array',
        item: read(a[0]),
        min: a[1] ? literal(a[1]) : 0,
        max: a[2] ? literal(a[2]) : 2048,
      };
    if (name === 'map')
      return {
        kind: 'map',
        key: read(a[0]),
        item: read(a[1]),
        max: a[2] ? literal(a[2]) : 2048,
      };
  }
  throw Error('Unsupported schema node ' + n.getText(source).slice(0, 70));
}
const controls = object(declarations.get('literalProperties'));
if (process.argv.includes('--write')) {
  fs.mkdirSync('src/owner-design', { recursive: true });
  fs.writeFileSync(
    'src/owner-design/property-controls.ts',
    "// Generated from the closed presentation schema by tests/owner-design-generate-controls.mjs.\nimport type { Control } from './control-schema';\nexport const PROPERTY_CONTROLS: Record<string, Control> = " +
      JSON.stringify(controls, null, 2) +
      ';\n',
  );
}
