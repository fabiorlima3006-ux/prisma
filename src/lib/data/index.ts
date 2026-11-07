import 'server-only';
import { env } from '../config/env';
import { createBcbProvider } from './providers/bcb';
import { createBrapiProvider } from './providers/brapi';
import { createDemoProvider } from './providers/demo';
import { createMarketDataService } from './service';

export const marketData = createMarketDataService({
  env,
  providers: {
    bcb: createBcbProvider({ baseUrl: env.BCB_BASE_URL }),
    ...(env.BRAPI_TOKEN ? { brapi: createBrapiProvider({ token: env.BRAPI_TOKEN }) } : {}),
    demo: createDemoProvider(),
  },
});
