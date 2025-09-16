import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { orderId, orderNumber } = await req.json()

    console.log('🗑️ Admin deleting order:', orderNumber, 'ID:', orderId)

    // Récupérer les informations de la commande avec tous les fichiers
    const { data: orderData, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select(`
        id, 
        order_number, 
        user_id,
        order_files(file_path),
        delivered_files(file_path)
      `)
      .eq('id', orderId)
      .single()

    if (fetchError) {
      console.error('Error fetching order:', fetchError)
      throw new Error('Commande introuvable')
    }

    console.log('✅ Order found:', orderData)

    // Supprimer les fichiers physiques du storage - fichiers originaux
    if (orderData.order_files && orderData.order_files.length > 0) {
      console.log('🗑️ Deleting physical files from photo-uploads bucket...')
      const filePaths = orderData.order_files.map(f => f.file_path)
      
      const { data: deletedFiles, error: storageError } = await supabaseAdmin.storage
        .from('photo-uploads')
        .remove(filePaths)

      if (storageError) {
        console.error('Error deleting files from storage:', storageError)
      } else {
        console.log('✅ Physical files deleted from photo-uploads:', deletedFiles?.length || 0)
      }
    }

    // Supprimer les fichiers physiques du storage - fichiers livrés
    if (orderData.delivered_files && orderData.delivered_files.length > 0) {
      console.log('🗑️ Deleting physical files from final-photos bucket...')
      const filePaths = orderData.delivered_files.map(f => f.file_path)
      
      const { data: deletedFiles, error: storageError } = await supabaseAdmin.storage
        .from('final-photos')
        .remove(filePaths)

      if (storageError) {
        console.error('Error deleting files from final-photos storage:', storageError)
      } else {
        console.log('✅ Physical files deleted from final-photos:', deletedFiles?.length || 0)
      }
    }

    // Supprimer les entrées en base - fichiers livrés
    console.log('🗑️ Deleting delivered files records...')
    const { error: deliveredFilesError } = await supabaseAdmin
      .from('delivered_files')
      .delete()
      .eq('order_id', orderId)

    if (deliveredFilesError) {
      console.error('Error deleting delivered files records:', deliveredFilesError)
    }

    // Supprimer les entrées en base - fichiers de commande
    console.log('🗑️ Deleting order files records...')
    const { error: orderFilesError } = await supabaseAdmin
      .from('order_files')
      .delete()
      .eq('order_id', orderId)

    if (orderFilesError) {
      console.error('Error deleting order files records:', orderFilesError)
    }

    // Supprimer les éléments de facture associés
    console.log('🗑️ Deleting invoice items records...')
    const { error: invoiceItemsError } = await supabaseAdmin
      .from('invoice_items')
      .delete()
      .eq('order_id', orderId)

    if (invoiceItemsError) {
      console.error('Error deleting invoice items records:', invoiceItemsError)
    }

    // Supprimer la commande
    console.log('🗑️ Deleting order record...')
    const { error: orderError } = await supabaseAdmin
      .from('orders')
      .delete()
      .eq('id', orderId)

    if (orderError) {
      console.error('Error deleting order:', orderError)
      if (orderError.code === '23503') {
        console.log('🔁 FK constraint from invoice_items detected. Nullifying references then retrying...')
        const { error: nullifyError } = await supabaseAdmin
          .from('invoice_items')
          .update({ order_id: null })
          .eq('order_id', orderId)
        if (nullifyError) {
          console.error('Error nullifying invoice_items.order_id:', nullifyError)
        } else {
          console.log('✅ invoice_items references cleared, retrying order delete...')
        }
        const { error: retryError } = await supabaseAdmin
          .from('orders')
          .delete()
          .eq('id', orderId)
        if (retryError) {
          console.error('Retry delete failed:', retryError)
          throw retryError
        }
      } else {
        throw orderError
      }
    }

    console.log('✅ Order completely deleted:', orderNumber)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Commande ${orderNumber} supprimée avec succès` 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Delete order error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erreur lors de la suppression' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})