import { sampleProvider } from './sampleProvider';
import type { TaobaoProvider } from './types';

// Register real providers here (same TaobaoProvider interface) and select one
// with TAOBAO_PROVIDER. Their API keys stay in server-side env vars.
const PROVIDERS: Record<string, TaobaoProvider> = {
  sample: sampleProvider,
};

export function getTaobaoProvider(): TaobaoProvider {
  return PROVIDERS[process.env.TAOBAO_PROVIDER || 'sample'] ?? sampleProvider;
}
