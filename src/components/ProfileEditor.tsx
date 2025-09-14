import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { User, Building2, Phone, MapPin, Edit, Save, X } from "lucide-react";

const ProfileEditor = () => {
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    contact_name: profile?.contact_name || '',
    company_name: profile?.company_name || '',
    phone: profile?.phone || '',
    billing_address: profile?.billing_address || '',
    billing_company: profile?.billing_company || ''
  });

  const handleSave = async () => {
    try {
      const { error } = await updateProfile(formData);
      
      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de mettre à jour le profil",
          variant: "destructive",
        });
        return;
      }

      setIsEditing(false);
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été sauvegardées avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setFormData({
      contact_name: profile?.contact_name || '',
      company_name: profile?.company_name || '',
      phone: profile?.phone || '',
      billing_address: profile?.billing_address || '',
      billing_company: profile?.billing_company || ''
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Modifier mes informations
            </span>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave}>
                <Save className="h-4 w-4 mr-1" />
                Sauvegarder
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-1" />
                Annuler
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="contact_name">Nom de contact *</Label>
            <Input
              id="contact_name"
              value={formData.contact_name}
              onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
              placeholder="Votre nom complet"
            />
          </div>

          <div>
            <Label htmlFor="company_name">Nom de l'entreprise</Label>
            <Input
              id="company_name"
              value={formData.company_name}
              onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
              placeholder="Nom de votre entreprise"
            />
          </div>

          <div>
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="Votre numéro de téléphone"
            />
          </div>

          <div>
            <Label htmlFor="billing_company">Société de facturation</Label>
            <Input
              id="billing_company"
              value={formData.billing_company}
              onChange={(e) => setFormData(prev => ({ ...prev, billing_company: e.target.value }))}
              placeholder="Nom de la société pour facturation (si différent)"
            />
          </div>

          <div>
            <Label htmlFor="billing_address">Adresse de facturation</Label>
            <Textarea
              id="billing_address"
              value={formData.billing_address}
              onChange={(e) => setFormData(prev => ({ ...prev, billing_address: e.target.value }))}
              placeholder="Adresse complète pour facturation"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informations personnelles
          </span>
          <Button size="sm" onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4 mr-1" />
            Modifier
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <User className="h-5 w-5 text-gray-500" />
          <div>
            <p className="text-sm text-gray-600">Nom de contact</p>
            <p className="font-medium">{profile?.contact_name || 'Non renseigné'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <Building2 className="h-5 w-5 text-gray-500" />
          <div>
            <p className="text-sm text-gray-600">Entreprise</p>
            <p className="font-medium">{profile?.company_name || 'Non renseignée'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <Phone className="h-5 w-5 text-gray-500" />
          <div>
            <p className="text-sm text-gray-600">Téléphone</p>
            <p className="font-medium">{profile?.phone || 'Non renseigné'}</p>
          </div>
        </div>

        {profile?.billing_company && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Building2 className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-sm text-gray-600">Société de facturation</p>
              <p className="font-medium">{profile.billing_company}</p>
            </div>
          </div>
        )}

        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
          <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
          <div>
            <p className="text-sm text-gray-600">Adresse de facturation</p>
            <p className="font-medium whitespace-pre-line">
              {profile?.billing_address || 'Non renseignée'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileEditor;