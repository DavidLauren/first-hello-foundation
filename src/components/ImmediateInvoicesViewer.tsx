import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FileText, RefreshCw, Eye, Download, Calendar, Euro, Trash2, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import InvoiceModal from "./InvoiceModal";

interface ImmediateInvoice {
  id: string;
  invoice_number: string;
  user_id: string;
  total_amount: number;
  currency: string;
  status: string;
  due_date: string;
  created_at: string;
  issued_date: string;
  profiles: {
    contact_name: string;
    email: string;
  };
  invoice_items: {
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    order_id?: string;
  }[];
}

const ImmediateInvoicesViewer = () => {
  const [invoices, setInvoices] = useState<ImmediateInvoice[]>([]);
  const [archivedInvoices, setArchivedInvoices] = useState<ImmediateInvoice[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [selectedInvoice, setSelectedInvoice] = useState<ImmediateInvoice | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const loadInvoices = async () => {
    setLoading(true);
    try {
      // Calculer les dates selon la période sélectionnée
      const now = new Date();
      let startDate: Date;
      
      switch (selectedPeriod) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
      }

      // Charger les factures immédiates actives (payées et échéance = date d'émission)
      const { data: activeData, error: activeError } = await supabase
        .from('deferred_invoices')
        .select(`
          id,
          invoice_number,
          user_id,
          total_amount,
          currency,
          status,
          due_date,
          created_at,
          issued_date,
          archived_at,
          invoice_items(description, quantity, unit_price, total_price, order_id)
        `)
        .eq('status', 'paid')
        .is('archived_at', null)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      // Charger les factures archivées
      const { data: archivedData, error: archivedError } = await supabase
        .from('deferred_invoices')
        .select(`
          id,
          invoice_number,
          user_id,
          total_amount,
          currency,
          status,
          due_date,
          created_at,
          issued_date,
          archived_at,
          invoice_items(description, quantity, unit_price, total_price, order_id)
        `)
        .eq('status', 'paid')
        .not('archived_at', 'is', null)
        .gte('created_at', startDate.toISOString())
        .order('archived_at', { ascending: false });

      if (activeError || archivedError) {
        console.error('Error loading immediate invoices:', activeError || archivedError);
        toast({
          title: "Erreur",
          description: "Impossible de charger les factures immédiates",
          variant: "destructive",
        });
        return;
      }

      // Filtrer pour ne garder que les factures immédiates (échéance = émission)
      const filterImmediate = (invoices: any[]) => {
        return invoices?.filter(invoice => {
          const dueDate = new Date(invoice.due_date).toDateString();
          const issuedDate = new Date(invoice.issued_date).toDateString();
          return dueDate === issuedDate;
        }) || [];
      };

      const immediateInvoices = filterImmediate(activeData);
      const immediateArchivedInvoices = filterImmediate(archivedData);

      // Récupérer les profils utilisateurs
      const allInvoices = [...immediateInvoices, ...immediateArchivedInvoices];
      if (allInvoices.length > 0) {
        const userIds = [...new Set(allInvoices.map(invoice => invoice.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, contact_name, email')
          .in('id', userIds);

        // Joindre les données pour les factures actives
        const invoicesWithProfiles = immediateInvoices.map(invoice => ({
          ...invoice,
          total_amount: invoice.total_amount / 100, // Conversion centimes vers euros
          profiles: profiles?.find(p => p.id === invoice.user_id) || { contact_name: 'N/A', email: 'N/A' },
          invoice_items: invoice.invoice_items?.map(item => ({
            ...item,
            unit_price: item.unit_price / 100,
            total_price: item.total_price / 100
          })) || []
        }));

        // Joindre les données pour les factures archivées
        const archivedInvoicesWithProfiles = immediateArchivedInvoices.map(invoice => ({
          ...invoice,
          total_amount: invoice.total_amount / 100,
          profiles: profiles?.find(p => p.id === invoice.user_id) || { contact_name: 'N/A', email: 'N/A' },
          invoice_items: invoice.invoice_items?.map(item => ({
            ...item,
            unit_price: item.unit_price / 100,
            total_price: item.total_price / 100
          })) || []
        }));

        setInvoices(invoicesWithProfiles);
        setArchivedInvoices(archivedInvoicesWithProfiles);
      } else {
        setInvoices([]);
        setArchivedInvoices([]);
      }
    } catch (error) {
      console.error('Error in loadInvoices:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [selectedPeriod]);

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'today': return "Aujourd'hui";
      case 'week': return "7 derniers jours";
      case 'month': return "Ce mois";
    }
  };

  const getTotalAmount = () => {
    const currentInvoices = showArchived ? archivedInvoices : invoices;
    return currentInvoices.reduce((sum, invoice) => sum + invoice.total_amount, 0);
  };

  const getTotalPhotos = () => {
    const currentInvoices = showArchived ? archivedInvoices : invoices;
    return currentInvoices.reduce((sum, invoice) => 
      sum + invoice.invoice_items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    );
  };

  const handleViewInvoice = (invoice: ImmediateInvoice) => {
    setSelectedInvoice(invoice);
    setIsModalOpen(true);
  };

  const handleArchiveInvoice = async (invoiceId: string) => {
    try {
      const { error } = await supabase
        .from('deferred_invoices')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', invoiceId);

      if (error) {
        console.error('Error archiving invoice:', error);
        toast({
          title: "Erreur",
          description: "Impossible d'archiver la facture",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Facture archivée",
        description: "La facture a été déplacée vers la corbeille",
      });

      loadInvoices();
    } catch (error) {
      console.error('Error archiving invoice:', error);
    }
  };

  const handleRestoreInvoice = async (invoiceId: string) => {
    try {
      const { error } = await supabase
        .from('deferred_invoices')
        .update({ archived_at: null })
        .eq('id', invoiceId);

      if (error) {
        console.error('Error restoring invoice:', error);
        toast({
          title: "Erreur",
          description: "Impossible de restaurer la facture",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Facture restaurée",
        description: "La facture a été restaurée",
      });

      loadInvoices();
    } catch (error) {
      console.error('Error restoring invoice:', error);
    }
  };

  const handleEmptyTrash = async () => {
    try {
      // Supprimer définitivement les factures archivées (immédiates uniquement)
      const archivedIds = archivedInvoices.map(inv => inv.id);
      
      if (archivedIds.length === 0) return;

      const { error } = await supabase
        .from('deferred_invoices')
        .delete()
        .in('id', archivedIds);

      if (error) {
        console.error('Error emptying trash:', error);
        toast({
          title: "Erreur",
          description: "Impossible de vider la corbeille",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Corbeille vidée",
        description: "Toutes les factures immédiates archivées ont été supprimées définitivement",
      });

      loadInvoices();
    } catch (error) {
      console.error('Error emptying trash:', error);
    }
  };

  const handleDownloadPDF = async (invoice: ImmediateInvoice) => {
    try {
      // Créer un conteneur temporaire pour le contenu de la facture
      const printContent = document.getElementById('invoice-content');
      if (printContent) {
        const originalContents = document.body.innerHTML;
        document.body.innerHTML = printContent.innerHTML;
        window.print();
        document.body.innerHTML = originalContents;
        window.location.reload(); // Recharger pour restaurer les scripts React
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le PDF",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Factures Immédiates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="bg-gray-200 h-6 rounded"></div>
            <div className="bg-gray-200 h-6 rounded"></div>
            <div className="bg-gray-200 h-6 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {showArchived ? `Corbeille (${archivedInvoices.length})` : `Factures Immédiates - ${getPeriodLabel()} (${invoices.length})`}
          </CardTitle>
          <div className="flex gap-2">
            {!showArchived && (
              <>
                <Button
                  variant={selectedPeriod === 'today' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPeriod('today')}
                >
                  Aujourd'hui
                </Button>
                <Button
                  variant={selectedPeriod === 'week' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPeriod('week')}
                >
                  7 jours
                </Button>
                <Button
                  variant={selectedPeriod === 'month' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPeriod('month')}
                >
                  Mois
                </Button>
              </>
            )}
            <Button
              variant={showArchived ? "default" : "outline"}
              size="sm"
              onClick={() => setShowArchived(!showArchived)}
            >
              {showArchived ? <RotateCcw className="h-4 w-4 mr-1" /> : <Trash2 className="h-4 w-4 mr-1" />}
              {showArchived ? "Retour" : "Corbeille"}
            </Button>
            {showArchived && archivedInvoices.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleEmptyTrash}
              >
                Vider la corbeille
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={loadInvoices}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Statistiques */}
        {!showArchived && (
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <FileText className="h-6 w-6 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold text-blue-700">{invoices.length}</p>
              <p className="text-sm text-blue-600">Factures</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Calendar className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold text-green-700">{getTotalPhotos()}</p>
              <p className="text-sm text-green-600">Photos traitées</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Euro className="h-6 w-6 mx-auto mb-2 text-purple-600" />
              <p className="text-2xl font-bold text-purple-700">{getTotalAmount().toFixed(2)}€</p>
              <p className="text-sm text-purple-600">Chiffre d'affaires</p>
            </div>
          </div>
        )}

        {/* Liste des factures */}
        {(showArchived ? archivedInvoices : invoices).length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{showArchived ? "Aucune facture dans la corbeille" : "Aucune facture immédiate pour cette période"}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <h4 className="font-semibold">
              {showArchived ? "Factures archivées :" : "Détail des factures :"}
            </h4>
            {(showArchived ? archivedInvoices : invoices).map((invoice) => (
              <div key={invoice.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h5 className="font-semibold text-lg">{invoice.invoice_number}</h5>
                    <p className="text-sm text-gray-600">
                      {invoice.profiles?.contact_name} ({invoice.profiles?.email})
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-green-100 text-green-800 mb-2">
                      ✅ Payée
                    </Badge>
                    <p className="text-lg font-bold">
                      {invoice.total_amount.toFixed(2)}€
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                  <div>
                    <span className="font-medium">Créée le :</span>{' '}
                    {new Date(invoice.created_at).toLocaleDateString('fr-FR')} à {new Date(invoice.created_at).toLocaleTimeString('fr-FR')}
                  </div>
                  <div>
                    <span className="font-medium">Payée le :</span>{' '}
                    {new Date(invoice.issued_date).toLocaleDateString('fr-FR')} à {new Date(invoice.issued_date).toLocaleTimeString('fr-FR')}
                  </div>
                </div>

                {invoice.invoice_items && invoice.invoice_items.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <h6 className="font-medium text-sm mb-2">Prestations :</h6>
                    {invoice.invoice_items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.description}</span>
                        <span>{item.total_price.toFixed(2)}€</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 mt-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewInvoice(invoice)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Voir
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDownloadPDF(invoice)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    PDF
                  </Button>
                  {showArchived ? (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleRestoreInvoice(invoice.id)}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Restaurer
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleArchiveInvoice(invoice.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Archiver
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      <InvoiceModal
        invoice={selectedInvoice}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onDownloadPDF={handleDownloadPDF}
      />
    </Card>
  );
};

export default ImmediateInvoicesViewer;