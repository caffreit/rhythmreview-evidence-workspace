import seedJson from './data/seed.json';
import { SeedSchema } from './domain';

export const seed = SeedSchema.parse(seedJson);
