import type { Integration } from "@/types/connections";
import Store from 'electron-store';

// Defines what data we store
interface StoreSchema {
  integrations: Integration[];
  activeIntegrationId: string | null;
}

// Create store with empty defaults
const store = new Store<StoreSchema>({
  defaults: {
    integrations: [],
    activeIntegrationId: null,
  }
});

// Export everything as a single object
const storeUtils = {
  get: (key: keyof StoreSchema) => store.get(key),
  set: (key: keyof StoreSchema, value: any) => store.set(key, value),
  store
};

export default storeUtils;
