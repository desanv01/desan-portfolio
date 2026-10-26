// Node-only entry for the framework proxy and the server-only React wrapper.
// Never re-export this database loader from the public client-safe index.
import { loadPublicSite, type PublicSite } from './index';

export async function readPublishedSite(): Promise<PublicSite> {
  return loadPublicSite(async () => {
    const [{ getPayload }, { default: config }, { currentPublication }] =
      await Promise.all([
        import('payload'),
        import('../cms/config'),
        import('../cms/publication'),
      ]);
    return currentPublication(await getPayload({ config }));
  });
}
