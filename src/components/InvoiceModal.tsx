import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DeferredInvoice {
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
  }[];
}

interface InvoiceModalProps {
  invoice: DeferredInvoice | null;
  isOpen: boolean;
  onClose: () => void;
  onDownloadPDF: (invoice: DeferredInvoice) => void;
}

const InvoiceModal = ({ invoice, isOpen, onClose, onDownloadPDF }: InvoiceModalProps) => {
  const [companyInfo, setCompanyInfo] = useState<any>(null);

  useEffect(() => {
    const loadCompanyInfo = async () => {
      const { data } = await supabase
        .from('company_info')
        .select('*')
        .single();
      setCompanyInfo(data);
    };
    
    if (isOpen) {
      loadCompanyInfo();
    }
  }, [isOpen]);

  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Facture {invoice.invoice_number}</DialogTitle>
        </DialogHeader>
        
        <div className="bg-white p-8 space-y-6" id="invoice-content">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">FACTURE</h1>
              <p className="text-lg font-semibold mt-2">{invoice.invoice_number}</p>
            </div>
            <div className="text-right text-sm text-gray-600">
              <p>Date d'émission : {new Date(invoice.issued_date).toLocaleDateString('fr-FR')}</p>
              <p>Date d'échéance : {new Date(invoice.due_date).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>

          {/* Informations entreprise */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">De :</h3>
              <div className="text-sm text-gray-600">
                <p className="font-semibold">{companyInfo?.company_name || 'Configuration requise dans Admin > Infos Entreprise'}</p>
                {companyInfo?.address && <p>{companyInfo.address}</p>}
                {companyInfo?.postal_code && companyInfo?.city && (
                  <p>{companyInfo.postal_code} {companyInfo.city}, {companyInfo.country || 'France'}</p>
                )}
                {companyInfo?.email && <p>{companyInfo.email}</p>}
                {companyInfo?.phone && <p>Tél : {companyInfo.phone}</p>}
                {companyInfo?.siret && <p>SIRET : {companyInfo.siret}</p>}
                {companyInfo?.vat_number && <p>N° TVA : {companyInfo.vat_number}</p>}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">À :</h3>
              <div className="text-sm text-gray-600">
                <p className="font-semibold">{invoice.profiles.contact_name}</p>
                <p>{invoice.profiles.email}</p>
              </div>
            </div>
          </div>

          {/* Tableau des articles */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Détail des prestations</h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-4 font-semibold text-gray-900">Description</th>
                    <th className="text-center p-4 font-semibold text-gray-900">Quantité</th>
                    <th className="text-right p-4 font-semibold text-gray-900">Prix unitaire</th>
                    <th className="text-right p-4 font-semibold text-gray-900">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.invoice_items.map((item, index) => (
                    <tr key={index} className="border-t border-gray-200">
                      <td className="p-4 text-gray-900">{item.description}</td>
                      <td className="p-4 text-center text-gray-900">{item.quantity}</td>
                      <td className="p-4 text-right text-gray-900">{item.unit_price.toFixed(2)}€</td>
                      <td className="p-4 text-right font-semibold text-gray-900">{item.total_price.toFixed(2)}€</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-end">
            <div className="bg-gray-50 p-6 rounded-lg min-w-64">
              <div className="space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Sous-total HT :</span>
                  <span>{invoice.total_amount.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>TVA :</span>
                  <span>Non applicable</span>
                </div>
                <div className="border-t pt-2 flex justify-between text-lg font-bold text-gray-900">
                  <span>Total TTC :</span>
                  <span>{invoice.total_amount.toFixed(2)}€</span>
                </div>
              </div>
            </div>
          </div>

          {/* Conditions de paiement */}
          <div className="text-sm text-gray-600 border-t pt-6">
            <h4 className="font-semibold text-gray-900 mb-2">Conditions de paiement :</h4>
            <p>Paiement à 30 jours. En cas de retard de paiement, des pénalités de retard au taux de 3 fois le taux d'intérêt légal pourront être appliquées.</p>
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimer
          </Button>
          <Button onClick={() => onDownloadPDF(invoice)}>
            <Download className="h-4 w-4 mr-2" />
            Télécharger PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceModal;