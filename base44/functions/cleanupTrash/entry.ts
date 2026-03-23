import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const allTrash = await base44.asServiceRole.entities.Trash.list();
    const now = new Date();
    const expired = allTrash.filter(item => new Date(item.expires_at) <= now);

    await Promise.all(expired.map(item => base44.asServiceRole.entities.Trash.delete(item.id)));

    return Response.json({ deleted: expired.length, message: `Raderade ${expired.length} utgångna papperskorgsobjekt` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});