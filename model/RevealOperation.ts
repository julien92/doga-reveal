export interface RevealOperation {
  id: number;
  hash: string;
  parameter: Parameter;
}

interface Parameter {
  entrypoint: string;
  value: Value;
}

interface Value {
  token_id: string;
  metadata: Metadata;
}

interface Metadata {
  attributes: Attribute;
}

interface Attribute {
  // Rarirty Score
  o: string;
  a: string;
}
