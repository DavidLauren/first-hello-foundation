import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Calendar, Eye, Trash2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

interface UserInvoice {
  id: string;
  invoice_number: string;
  total_amount: number;
  status: string;
  due_date: string;
  issued_date: string;
  currency: string;
  invoice_items: Array<{
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
}

const UserInvoicesViewer = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedInvoice, setSelectedInvoice] = useState<UserInvoice | null>(null);
  const [deletingInvoice, setDeletingInvoice] = useState<string | null>(null);

  // Récupérer les informations de l'entreprise
  const { data: companyInfo } = useQuery({
    queryKey: ['company-info'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_info')
        .select('*')
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching company info:', error);
      }
      return data;
    }
  });

  // Récupérer les informations du profil utilisateur
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }
      return data;
    },
    enabled: !!user
  });

  // Récupérer les factures de l'utilisateur
  const { data: invoices, isLoading } = useQuery({
    queryKey: ['user-invoices'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('deferred_invoices')
        .select(`
          *,
          invoice_items(*)
        `)
        .eq('user_id', user.id)
        .order('issued_date', { ascending: false });

      if (error) throw error;
      return data as UserInvoice[];
    },
    enabled: !!user
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">⏳ En attente</Badge>;
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">✅ Payée</Badge>;
      case 'overdue':
        return <Badge variant="destructive">⚠️ En retard</Badge>;
      case 'cancelled':
        return <Badge variant="outline">❌ Annulée</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getInvoiceType = (invoice: UserInvoice) => {
    // Détermine le type de facture selon la date d'échéance et le statut
    const isImmediate = invoice.status === 'paid' && 
      new Date(invoice.due_date).toDateString() === new Date(invoice.issued_date).toDateString();
    
    return isImmediate ? 'Facture immédiate' : 'Facture différée';
  };

  const handleDownloadPDF = (invoice: UserInvoice) => {
    console.log("Starting PDF download for invoice:", invoice.invoice_number);
    
    try {
      // Créer le contenu HTML pour l'impression
      const printContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Facture ${invoice.invoice_number}</title>
            <meta charset="utf-8">
            <style>
              body { 
                font-family: Arial, sans-serif; 
                margin: 20px; 
                color: #333;
                line-height: 1.6;
              }
              .invoice-header { 
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 40px; 
                border-bottom: 2px solid #eee;
                padding-bottom: 20px;
              }
              .company-info {
                flex: 1;
                margin-right: 20px;
              }
              .invoice-title {
                flex: 1;
                text-align: center;
                margin: 0 20px;
              }
              .invoice-number { 
                font-size: 24px; 
                font-weight: bold; 
                color: #333;
                margin-bottom: 10px;
              }
              .company-name {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 5px;
              }
              .billing-section {
                display: flex;
                justify-content: space-between;
                margin: 30px 0;
              }
              .billing-info {
                flex: 1;
                margin-right: 20px;
              }
              .billing-info h3 {
                font-size: 14px;
                text-transform: uppercase;
                color: #666;
                margin-bottom: 10px;
                border-bottom: 1px solid #eee;
                padding-bottom: 5px;
              }
              .table { 
                width: 100%; 
                border-collapse: collapse; 
                margin: 30px 0;
              }
              .table th, .table td { 
                border: 1px solid #ddd; 
                padding: 12px 8px; 
                text-align: left; 
              }
              .table th { 
                background-color: #f5f5f5; 
                font-weight: bold;
              }
              .table td {
                vertical-align: top;
              }
              .total-row {
                background-color: #f9f9f9;
                font-weight: bold;
              }
              .total { 
                font-weight: bold; 
                font-size: 18px; 
                text-align: right;
                margin-top: 20px;
                padding: 15px;
                background-color: #f5f5f5;
                border-radius: 5px;
              }
              .status {
                display: inline-block;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: bold;
                text-transform: uppercase;
              }
              .status-pending { background-color: #fff3cd; color: #856404; }
              .status-paid { background-color: #d4edda; color: #155724; }
              .status-overdue { background-color: #f8d7da; color: #721c24; }
              @media print {
                body { margin: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="invoice-header">
              <div class="company-info">
                ${companyInfo ? `
                  <div class="company-name">${companyInfo.company_name || 'Configuration requise dans Admin > Infos Entreprise'}</div>
                  ${companyInfo.address ? `<div>${companyInfo.address}</div>` : ''}
                  ${companyInfo.postal_code && companyInfo.city ? `<div>${companyInfo.postal_code} ${companyInfo.city}</div>` : ''}
                  ${companyInfo.country ? `<div>${companyInfo.country}</div>` : ''}
                  ${companyInfo.phone ? `<div>Tél: ${companyInfo.phone}</div>` : ''}
                  ${companyInfo.email ? `<div>Email: ${companyInfo.email}</div>` : ''}
                  ${companyInfo.website ? `<div>Web: ${companyInfo.website}</div>` : ''}
                  ${companyInfo.siret ? `<div>SIRET: ${companyInfo.siret}</div>` : ''}
                  ${companyInfo.vat_number ? `<div>TVA: ${companyInfo.vat_number}</div>` : ''}
                ` : `
                   <div class="company-name">Configuration requise dans Admin > Infos Entreprise</div>
                   <div>Veuillez configurer vos informations dans l'administration</div>
                `}
              </div>
              
              <div class="invoice-title">
                <h1 style="margin: 0; font-size: 28px;">FACTURE</h1>
                <div class="invoice-number">N° ${invoice.invoice_number}</div>
                <div>
                  <span class="status status-${invoice.status}">
                    ${invoice.status === 'pending' ? 'En attente' : 
                      invoice.status === 'paid' ? 'Payée' : 
                      invoice.status === 'overdue' ? 'En retard' : invoice.status}
                  </span>
                </div>
              </div>
              
              <div style="flex: 1; text-align: right; font-size: 12px; color: #666;">
                <div><strong>Date d'émission:</strong> ${new Date(invoice.issued_date).toLocaleDateString('fr-FR')}</div>
                <div><strong>Date d'échéance:</strong> ${new Date(invoice.due_date).toLocaleDateString('fr-FR')}</div>
              </div>
            </div>
            
            <div class="billing-section">
              <div class="billing-info">
                <h3>Facturé à:</h3>
                ${userProfile ? `
                  <div><strong>${userProfile.contact_name || 'Client'}</strong></div>
                  ${userProfile.company_name ? `<div>${userProfile.company_name}</div>` : ''}
                  <div>${userProfile.email}</div>
                  ${userProfile.phone ? `<div>Tél: ${userProfile.phone}</div>` : ''}
                  ${userProfile.billing_address ? `<div>${userProfile.billing_address}</div>` : ''}
                  ${userProfile.billing_company ? `<div>Société: ${userProfile.billing_company}</div>` : ''}
                ` : `
                  <div><strong>Client</strong></div>
                  <div>${user?.email}</div>
                `}
              </div>
              
              <div class="billing-info">
                <h3>Informations facture:</h3>
                <div><strong>Date d'émission:</strong> ${new Date(invoice.issued_date).toLocaleDateString('fr-FR')}</div>
                <div><strong>Date d'échéance:</strong> ${new Date(invoice.due_date).toLocaleDateString('fr-FR')}</div>
                <div><strong>Devise:</strong> ${invoice.currency}</div>
              </div>
            </div>
            
            <table class="table">
              <thead>
                <tr>
                  <th style="width: 50%;">Description</th>
                  <th style="width: 15%;">Quantité</th>
                  <th style="width: 17.5%;">Prix unitaire</th>
                  <th style="width: 17.5%;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${invoice.invoice_items.map(item => `
                  <tr>
                    <td>${item.description}</td>
                    <td style="text-align: center;">${item.quantity}</td>
                    <td style="text-align: right;">${(item.unit_price / 100).toFixed(2)}€</td>
                    <td style="text-align: right;">${(item.total_price / 100).toFixed(2)}€</td>
                  </tr>
                `).join('')}
                <tr class="total-row">
                  <td colspan="3" style="text-align: right;"><strong>Total à payer:</strong></td>
                  <td style="text-align: right;"><strong>${(invoice.total_amount / 100).toFixed(2)}€</strong></td>
                </tr>
              </tbody>
            </table>
            
            <div class="total">
              <div>Montant total: <strong>${(invoice.total_amount / 100).toFixed(2)}€</strong></div>
            </div>

            <div style="margin-top: 40px; font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 20px;">
              <p><strong>Merci pour votre confiance !</strong></p>
              <p><strong>TVA non applicable, art. 293 B du CGI</strong></p>
              ${companyInfo?.siret ? `<p>SIRET: ${companyInfo.siret}</p>` : ''}
              ${companyInfo?.vat_number ? `<p>N° TVA: ${companyInfo.vat_number}</p>` : ''}
            </div>

            <script>
              window.onload = function() {
                console.log("Print window loaded, starting print...");
                setTimeout(function() {
                  window.print();
                  setTimeout(function() {
                    window.close();
                  }, 1000);
                }, 500);
              };
            </script>
          </body>
        </html>
      `;

      console.log("Opening print window...");
      
      // Ouvrir la fenêtre d'impression
      const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
      
      if (!printWindow) {
        throw new Error("Impossible d'ouvrir la fenêtre d'impression. Vérifiez que les pop-ups ne sont pas bloqués.");
      }

      printWindow.document.write(printContent);
      printWindow.document.close();

      console.log("Print window opened successfully");

      toast({
        title: "PDF en cours de génération",
        description: `Facture ${invoice.invoice_number} - Une fenêtre d'impression va s'ouvrir`,
      });

    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le PDF. Vérifiez que les pop-ups ne sont pas bloqués.",
        variant: "destructive",
      });
    }
  };

  const deleteInvoice = async (invoice: UserInvoice) => {
    // Vérifier si la facture peut être supprimée
    if (invoice.status === 'paid') {
      toast({
        title: "Suppression impossible",
        description: "Vous ne pouvez pas supprimer une facture déjà payée",
        variant: "destructive",
      });
      return;
    }

    // Demander confirmation
    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer la facture ${invoice.invoice_number} ?\n\nCette action est irréversible.`
    );

    if (!confirmed) return;

    setDeletingInvoice(invoice.id);

    try {
      // Supprimer les items de la facture d'abord
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', invoice.id);

      if (itemsError) {
        throw new Error("Impossible de supprimer les éléments de la facture");
      }

      // Supprimer la facture
      const { error: deleteError } = await supabase
        .from('deferred_invoices')
        .delete()
        .eq('id', invoice.id);

      if (deleteError) {
        throw new Error("Impossible de supprimer la facture");
      }

      toast({
        title: "Facture supprimée",
        description: `La facture ${invoice.invoice_number} a été supprimée avec succès`,
      });

      // Refresh des données
      queryClient.invalidateQueries({ queryKey: ['user-invoices'] });

    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression",
        variant: "destructive",
      });
    } finally {
      setDeletingInvoice(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement de vos factures...</p>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Vous devez être connecté pour voir vos factures</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Mes Factures
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {invoices?.map((invoice) => (
              <div key={invoice.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{invoice.invoice_number}</h3>
                      {getStatusBadge(invoice.status)}
                      <Badge variant="outline" className="text-xs">
                        {getInvoiceType(invoice)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Émise le {new Date(invoice.issued_date).toLocaleDateString('fr-FR')}
                      </span>
                      <span>
                        Échéance: {new Date(invoice.due_date).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <p className="text-sm font-medium">
                      Total: {(invoice.total_amount / 100).toFixed(2)}€
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedInvoice(selectedInvoice?.id === invoice.id ? null : invoice)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      {selectedInvoice?.id === invoice.id ? 'Fermer' : 'Détails'}
                    </Button>
                    
                    <Button
                      size="sm"
                      onClick={() => handleDownloadPDF(invoice)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      PDF
                    </Button>

                    {/* Bouton de suppression - seulement pour les factures non payées */}
                    {invoice.status !== 'paid' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteInvoice(invoice)}
                        disabled={deletingInvoice === invoice.id}
                        className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                      >
                        {deletingInvoice === invoice.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        ) : (
                          <Trash2 className="h-4 w-4 mr-1" />
                        )}
                        {deletingInvoice === invoice.id ? "Suppression..." : "Supprimer"}
                      </Button>
                    )}
                  </div>
                </div>

                {selectedInvoice?.id === invoice.id && (
                  <div className="border-t pt-4 space-y-4">
                    <div>
                      <h4 className="font-medium text-sm mb-2">Détails de la facture :</h4>
                      <div className="space-y-2">
                        {invoice.invoice_items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                            <div className="flex-1">
                              <p className="text-sm font-medium">{item.description}</p>
                              <p className="text-xs text-muted-foreground">
                                Quantité: {item.quantity} × {(item.unit_price / 100).toFixed(2)}€
                              </p>
                            </div>
                            <div className="text-sm font-medium">
                              {(item.total_price / 100).toFixed(2)}€
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t flex justify-between items-center">
                        <span className="font-medium">Total</span>
                        <span className="text-lg font-bold">
                          {(invoice.total_amount / 100).toFixed(2)}€
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {invoices?.length === 0 && (
              <div className="text-center py-8">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Aucune facture trouvée</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Vos factures apparaîtront ici lorsque vous utiliserez la facturation différée
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserInvoicesViewer;