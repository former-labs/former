import { type Integration } from "@/types/connections";
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
  getIntegrations: () => store.get('integrations'),
  setIntegrations: (integrations: Integration[]) => store.set('integrations', integrations),
  getActiveIntegrationId: () => store.get('activeIntegrationId'),
  setActiveIntegrationId: (id: string | null) => store.set('activeIntegrationId', id),
  store
};

export default storeUtils;
