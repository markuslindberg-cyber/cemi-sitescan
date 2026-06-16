import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Use service role to list all users
    const users = await base44.asServiceRole.entities.User.list();

    // Return only non-sensitive fields needed for display
    const safeUsers = users.map(u => ({
      id: u.id,
      full_name: u.full_name,
      first_name: u.first_name,
      last_name: u.last_name,
      email: u.email,
      role: u.role,
      blocked: u.blocked || false,
      created_date: u.created_date,
      updated_date: u.updated_date,
    }));

    return Response.json({ users: safeUsers });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});