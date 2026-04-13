import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const sites = await base44.asServiceRole.entities.Site.list();
  const customers = await base44.asServiceRole.entities.Customer.list();

  const customerMap = {};
  for (const c of customers) {
    customerMap[c.id] = c;
  }

  let updated = 0;
  for (const site of sites) {
    if (!site.project_number && site.customer_id && customerMap[site.customer_id]?.project_number) {
      await base44.asServiceRole.entities.Site.update(site.id, {
        project_number: customerMap[site.customer_id].project_number
      });
      updated++;
    }
  }

  return Response.json({ updated, total: sites.length });
});