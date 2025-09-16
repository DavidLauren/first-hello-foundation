import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    const authHeader = req.headers.get('Authorization')
    const supabaseUser = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader || '' } },
    })

    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    const { data: authUser } = await supabaseUser.auth.getUser()
    if (!authUser?.user) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    // Check admin role via SECURITY DEFINER function
    const { data: isAdmin, error: roleError } = await supabaseAdmin.rpc('has_role', {
      _user_id: authUser.user.id,
      _role: 'admin',
    })

    if (roleError || !isAdmin) {
      return new Response(JSON.stringify({ success: false, error: 'Forbidden' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      })
    }

    const { userId } = await req.json()
    if (!userId) {
      return new Response(JSON.stringify({ success: false, error: 'userId is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    console.log('🗑️ Admin deleting user and all related data:', userId)

    // 1) Fetch all orders and related files
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select(`id, order_number, order_files(file_path), delivered_files(file_path)`) 
      .eq('user_id', userId)

    if (ordersError) throw ordersError

    // 2) Delete physical files per order
    for (const order of orders || []) {
      const originalPaths: string[] = (order.order_files || []).map((f: any) => f.file_path)
      const deliveredPaths: string[] = (order.delivered_files || []).map((f: any) => f.file_path)

      if (originalPaths.length > 0) {
        const { error: storageErr1 } = await supabaseAdmin.storage.from('photo-uploads').remove(originalPaths)
        if (storageErr1) console.error('Error deleting photo-uploads files:', storageErr1)
      }
      if (deliveredPaths.length > 0) {
        const { error: storageErr2 } = await supabaseAdmin.storage.from('final-photos').remove(deliveredPaths)
        if (storageErr2) console.error('Error deleting final-photos files:', storageErr2)
      }
    }

    // 3) Delete DB records related to orders
    const orderIds = (orders || []).map((o: any) => o.id)
    if (orderIds.length > 0) {
      await supabaseAdmin.from('delivered_files').delete().in('order_id', orderIds)
      await supabaseAdmin.from('order_files').delete().in('order_id', orderIds)
      await supabaseAdmin.from('orders').delete().in('id', orderIds)
    }

    // 4) Delete invoices and items
    const { data: invoices, error: invErr } = await supabaseAdmin
      .from('deferred_invoices')
      .select('id')
      .eq('user_id', userId)
    if (invErr) console.error('Error fetching invoices:', invErr)
    const invoiceIds = (invoices || []).map((i: any) => i.id)
    if (invoiceIds.length > 0) {
      await supabaseAdmin.from('invoice_items').delete().in('invoice_id', invoiceIds)
      await supabaseAdmin.from('deferred_invoices').delete().in('id', invoiceIds)
    }

    // 5) Delete referrals (both roles)
    await supabaseAdmin.from('referrals').delete().or(`referrer_id.eq.${userId},referred_id.eq.${userId}`)

    // 6) Delete promo usages and codes
    await supabaseAdmin.from('user_promo_usage').delete().eq('user_id', userId)
    await supabaseAdmin.from('referral_codes').delete().eq('user_id', userId)

    // 7) Delete user roles
    await supabaseAdmin.from('user_roles').delete().eq('user_id', userId)

    // 8) Delete profile
    const { error: profileErr } = await supabaseAdmin.from('profiles').delete().eq('id', userId)
    if (profileErr) console.error('Error deleting profile:', profileErr)

    // 9) Delete auth user (last)
    try {
      const { error: authDelError } = await supabaseAdmin.auth.admin.deleteUser(userId)
      if (authDelError) console.error('Error deleting auth user:', authDelError)
    } catch (e) {
      console.error('Admin deleteUser exception:', e)
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Utilisateur et données associées supprimés' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: any) {
    console.error('Delete client admin error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error?.message || 'Erreur lors de la suppression du client' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})