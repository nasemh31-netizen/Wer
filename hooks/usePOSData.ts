
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db/dexie';
import { useSessionStore } from '../store/useSessionStore';
import { PartnerType, CashSessionStatus } from '../types';

export const usePOSData = () => {
  const { orgId } = useSessionStore();

  const activeSession = useLiveQuery(
    () => db.cash_sessions.where({ status: CashSessionStatus.OPEN }).first(),
    []
  );

  const products = useLiveQuery(
    () => db.products.where('org_id').equals(orgId).toArray(),
    [orgId]
  );

  const productBarcodes = useLiveQuery(
    () => db.product_barcodes.where('org_id').equals(orgId).toArray(),
    [orgId]
  );

  const customers = useLiveQuery(
    () => db.partners.where('org_id').equals(orgId).filter(p => p.type === PartnerType.CUSTOMER).toArray(),
    [orgId]
  );

  return {
    activeSession,
    products,
    productBarcodes,
    customers
  };
};
