// Edge Function: admin-create-user
// Pre-creates a user account (email + initial password) from the Commissioner
// Panel. The `on_auth_user_created` trigger on auth.users automatically
// populates public.profiles with id/email/full_name from user_metadata.
//
// Deploy: Supabase dashboard -> Edge Functions -> Deploy a new function
// named `admin-create-user`, paste this file. No manual secrets required
// (Supabase auto-provides SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).
//
// Request (POST):
//   Headers: Authorization: Bearer <caller's access_token>
//   Body:    { "email": string, "password": string, "fullName": string }
//
// Response:
//   200 { success: true, userId: string }
//   400 invalid body
//   401 missing / invalid auth
//   403 caller is not commissioner/admin
//   409 email already exists
//   500 upstream failure

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(status: number, payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed' })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return json(401, { error: 'Missing or malformed Authorization header' })
  }
  const token = authHeader.slice('Bearer '.length)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) {
    return json(500, { error: 'Server misconfigured: missing Supabase env vars' })
  }

  const admin = createClient(supabaseUrl, serviceRoleKey)

  // Verify caller is a commissioner or admin
  const { data: userData, error: userErr } = await admin.auth.getUser(token)
  if (userErr || !userData?.user) {
    return json(401, { error: 'Invalid auth token' })
  }
  const { data: callerProfile, error: profileErr } = await admin
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .single()
  if (profileErr || !callerProfile) {
    return json(403, { error: 'Caller has no profile row' })
  }
  if (!['commissioner', 'admin'].includes(callerProfile.role)) {
    return json(403, { error: 'Caller is not a commissioner or admin' })
  }

  // Parse + validate body
  let body: { email?: unknown; password?: unknown; fullName?: unknown }
  try {
    body = await req.json()
  } catch {
    return json(400, { error: 'Invalid JSON body' })
  }
  const { email, password, fullName } = body
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json(400, { error: '`email` must be a valid email address' })
  }
  if (typeof password !== 'string' || password.length < 8) {
    return json(400, { error: '`password` must be at least 8 characters' })
  }
  if (typeof fullName !== 'string' || fullName.trim().length === 0) {
    return json(400, { error: '`fullName` is required' })
  }

  // Create the auth user. email_confirm=true marks the email as already
  // confirmed so the new user can log in immediately without any
  // confirmation flow. user_metadata.full_name is consumed by the
  // handle_new_user() trigger to seed the profiles row.
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName.trim() },
  })
  if (createErr) {
    const status = /already/i.test(createErr.message) ? 409 : 500
    return json(status, { error: createErr.message })
  }

  return json(200, { success: true, userId: created.user?.id })
})
