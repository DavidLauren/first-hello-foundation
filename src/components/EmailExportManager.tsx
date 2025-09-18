import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Users, Building, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const EmailExportManager = () => {
  const [exporting, setExporting] = useState<string | null>(null);

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast.error("Aucun email trouvé pour cette catégorie");
      return;
    }

    const csvContent = data.map(row => row.email).join(',');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`${data.length} emails exportés avec succès`);
  };

  const handleExport = async (type: 'particulier' | 'entreprise' | 'all') => {
    setExporting(type);
    
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('email, first_name, last_name, company_name')
        .order('email');

      if (error) {
        console.error('Erreur lors de la récupération des profils:', error);
        toast.error("Erreur lors de la récupération des données");
        return;
      }

      let filteredData = profiles || [];
      let filename = '';

      switch (type) {
        case 'particulier':
          filteredData = profiles?.filter(profile => !profile.company_name || profile.company_name.trim() === '') || [];
          filteredData = filteredData.map(profile => ({ ...profile, type: 'Particulier' }));
          filename = `emails-particuliers-${new Date().toISOString().split('T')[0]}.csv`;
          break;
        case 'entreprise':
          filteredData = profiles?.filter(profile => profile.company_name && profile.company_name.trim() !== '') || [];
          filteredData = filteredData.map(profile => ({ ...profile, type: 'Entreprise' }));
          filename = `emails-entreprises-${new Date().toISOString().split('T')[0]}.csv`;
          break;
        case 'all':
          filteredData = profiles?.map(profile => ({
            ...profile,
            type: profile.company_name && profile.company_name.trim() !== '' ? 'Entreprise' : 'Particulier'
          })) || [];
          filename = `emails-tous-${new Date().toISOString().split('T')[0]}.csv`;
          break;
      }

      exportToCSV(filteredData, filename);
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      toast.error("Erreur lors de l'export");
    } finally {
      setExporting(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export des Emails
        </CardTitle>
        <p className="text-sm text-gray-600">
          Exportez les adresses email de vos clients au format CSV
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={() => handleExport('particulier')}
            disabled={exporting !== null}
            className="flex items-center gap-2 h-auto flex-col p-6"
            variant="outline"
          >
            <Users className="h-6 w-6" />
            <div className="text-center">
              <div className="font-medium">Particuliers</div>
              <div className="text-xs text-gray-500">Clients sans entreprise</div>
            </div>
            {exporting === 'particulier' && (
              <div className="text-xs">Export en cours...</div>
            )}
          </Button>

          <Button
            onClick={() => handleExport('entreprise')}
            disabled={exporting !== null}
            className="flex items-center gap-2 h-auto flex-col p-6"
            variant="outline"
          >
            <Building className="h-6 w-6" />
            <div className="text-center">
              <div className="font-medium">Entreprises</div>
              <div className="text-xs text-gray-500">Clients avec entreprise</div>
            </div>
            {exporting === 'entreprise' && (
              <div className="text-xs">Export en cours...</div>
            )}
          </Button>

          <Button
            onClick={() => handleExport('all')}
            disabled={exporting !== null}
            className="flex items-center gap-2 h-auto flex-col p-6"
            variant="outline"
          >
            <Globe className="h-6 w-6" />
            <div className="text-center">
              <div className="font-medium">Tout le monde</div>
              <div className="text-xs text-gray-500">Tous les clients</div>
            </div>
            {exporting === 'all' && (
              <div className="text-xs">Export en cours...</div>
            )}
          </Button>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-sm mb-2">Format du fichier CSV :</h3>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Email : Adresse email du client (seulement)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailExportManager;