export abstract class IHashService {
  abstract hash(text: string): Promise<string>;
  abstract compare(text: string, hashed: string): Promise<boolean>;
}
