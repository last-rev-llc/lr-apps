export class FeatureAccessError extends Error {
  readonly feature: string;

  constructor(feature: string) {
    super(`feature access denied: ${feature}`);
    this.name = "FeatureAccessError";
    this.feature = feature;
  }
}
