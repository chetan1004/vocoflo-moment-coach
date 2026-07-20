export class ModelOutputError extends Error {
  constructor(readonly category: "missing_output_text" | "invalid_json" | "schema_validation") {
    super("Model output failed validation.");
    this.name = "ModelOutputError";
  }
}
