// Edge Function: admin-set-password
// Force-sets another user's password. Called from the Commissioner Panel
// by an authenticated user whose profile row has role='commissioner' or 'admin'.
//
// Deploy:
//   - Dashboard: Supabase -> Edge Functions -> Create a new function
//     named `admin-set-password` and paste the contents of this file.
//   - CLI: `supabase functions deploy admin-set-password`
//
// Supabase auto-provides SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY as
// env vars to every Edge Function, so no manual secret setup is needed.
//
// Request (POST):
//   Headers: Authorization: Bearer <caller's access_token>
//   Body:    { "targetUserId": "<uuid>", "newPassword": "<string, >= 8 chars>" }
//
// Response:
//   200 { success: true }
//   400 invalid body
//   401 missing / invalid auth
//   403 caller is not commissioner/admin
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

  // Verify caller: the JWT must resolve to a real user, and that user's
  // profile row must have role commissioner or admin.
  const { data: userData, error: userErr } = await admin.auth.getUser(token)
  if (userErr || !userData?.user) {
    return json(401, { error: 'Invalid auth token' })
  }
  const callerId = userData.user.id

  const { data: callerProfile, error: profileErr } = await admin
    .from('profiles')
    .select('role')
    .eq('id', callerId)
    .single()
  if (profileErr || !callerProfile) {
    return json(403, { error: 'Caller has no profile row' })
  }
  if (!['commissioner', 'admin'].includes(callerProfile.role)) {
    return json(403, { error: 'Caller is not a commissioner or admin' })
  }

  // Parse + validate body
  let body: { targetUserId?: unknown; newPassword?: unknown }
  try {
    body = await req.json()
  } catch {
    return json(400, { error: 'Invalid JSON body' })
  }
  const { targetUserId, newPassword } = body
  if (typeof targetUserId !== 'string' || targetUserId.length === 0) {
    return json(400, { error: '`targetUserId` is required' })
  }
  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    return json(400, { error: '`newPassword` must be at least 8 characters' })
  }

  // Force-set password
  const { error: updateErr } = await admin.auth.admin.updateUserById(targetUserId, {
    password: newPassword,
  })
  if (updateErr) {
    return json(500, { error: `Failed to update password: ${updateErr.message}` })
  }

  return json(200, { success: true })
})
