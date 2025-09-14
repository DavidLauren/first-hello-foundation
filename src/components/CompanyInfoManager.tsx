import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Save, RefreshCw } from "lucide-react";

interface CompanyInfo {
  id?: string;
  company_name: string;
  address: string;
  postal_code: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  siret: string;
  vat_number: string;
  registration_number: string;
  logo_url: string;
}

const CompanyInfoManager = () => {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    company_name: '',
    address: '',
    postal_code: '',
    city: '',
    country: 'France',
    phone: '',
    email: '',
    website: '',
    siret: '',
    vat_number: '',
    registration_number: '',
    logo_url: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const loadCompanyInfo = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('company_info')
        .select('*')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading company info:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les informations de l'entreprise",
          variant: "destructive",
        });
        return;
      }

      if (data) {
        setCompanyInfo(data);
      }
    } catch (error) {
      console.error('Error in loadCompanyInfo:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveCompanyInfo = async () => {
    setSaving(true);
    try {
      if (companyInfo.id) {
        // Update existing
        const { error } = await supabase
          .from('company_info')
          .update(companyInfo)
          .eq('id', companyInfo.id);

        if (error) {
          console.error('Error updating company info:', error);
          toast({
            title: "Erreur",
            description: "Impossible de mettre à jour les informations",
            variant: "destructive",
          });
          return;
        }
      } else {
        // Create new
        const { data, error } = await supabase
          .from('company_info')
          .insert([companyInfo])
          .select()
          .single();

        if (error) {
          console.error('Error creating company info:', error);
          toast({
            title: "Erreur",
            description: "Impossible de créer les informations",
            variant: "destructive",
          });
          return;
        }

        setCompanyInfo(data);
      }

      toast({
        title: "Informations sauvegardées",
        description: "Les informations de l'entreprise ont été mises à jour",
      });
    } catch (error) {
      console.error('Error saving company info:', error);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadCompanyInfo();
  }, []);

  const handleInputChange = (field: keyof CompanyInfo, value: string) => {
    setCompanyInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Informations de l'Entreprise
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
            <Building2 className="h-5 w-5" />
            Informations de l'Entreprise
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={loadCompanyInfo}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="company_name">Nom de l'entreprise *</Label>
            <Input
              id="company_name"
              value={companyInfo.company_name}
              onChange={(e) => handleInputChange('company_name', e.target.value)}
              placeholder="Nom de votre entreprise"
            />
          </div>
          <div>
            <Label htmlFor="siret">SIRET</Label>
            <Input
              id="siret"
              value={companyInfo.siret}
              onChange={(e) => handleInputChange('siret', e.target.value)}
              placeholder="Numéro SIRET"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="address">Adresse</Label>
          <Textarea
            id="address"
            value={companyInfo.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            placeholder="Adresse complète de l'entreprise"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="postal_code">Code postal</Label>
            <Input
              id="postal_code"
              value={companyInfo.postal_code}
              onChange={(e) => handleInputChange('postal_code', e.target.value)}
              placeholder="75000"
            />
          </div>
          <div>
            <Label htmlFor="city">Ville</Label>
            <Input
              id="city"
              value={companyInfo.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              placeholder="Paris"
            />
          </div>
          <div>
            <Label htmlFor="country">Pays</Label>
            <Input
              id="country"
              value={companyInfo.country}
              onChange={(e) => handleInputChange('country', e.target.value)}
              placeholder="France"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              value={companyInfo.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="+33 1 23 45 67 89"
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={companyInfo.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="contact@entreprise.com"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="website">Site web</Label>
          <Input
            id="website"
            value={companyInfo.website}
            onChange={(e) => handleInputChange('website', e.target.value)}
            placeholder="https://www.entreprise.com"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="vat_number">Numéro de TVA</Label>
            <Input
              id="vat_number"
              value={companyInfo.vat_number}
              onChange={(e) => handleInputChange('vat_number', e.target.value)}
              placeholder="FR 12 345 678 901"
            />
          </div>
          <div>
            <Label htmlFor="registration_number">Numéro RCS</Label>
            <Input
              id="registration_number"
              value={companyInfo.registration_number}
              onChange={(e) => handleInputChange('registration_number', e.target.value)}
              placeholder="RCS Paris 123 456 789"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="logo_url">URL du logo</Label>
          <Input
            id="logo_url"
            value={companyInfo.logo_url}
            onChange={(e) => handleInputChange('logo_url', e.target.value)}
            placeholder="https://example.com/logo.png"
          />
        </div>

        <div className="pt-4 border-t">
          <Button
            onClick={saveCompanyInfo}
            disabled={saving || !companyInfo.company_name}
            className="w-full bg-gradient-button hover:scale-105 transform transition-all duration-300"
          >
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder les informations
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompanyInfoManager;