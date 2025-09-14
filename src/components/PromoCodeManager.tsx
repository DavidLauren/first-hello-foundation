import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Save, X, Gift, Calendar, Users, Eye, EyeOff } from 'lucide-react';
import { PromoCode } from '@/hooks/usePromoCodes';

const PromoCodeManager = () => {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [editingCode, setEditingCode] = useState<PromoCode | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPromoCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching promo codes:', error);
        return;
      }

      setPromoCodes(data || []);
    } catch (error) {
      console.error('Error in fetchPromoCodes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const savePromoCode = async (promoCode: Partial<PromoCode>) => {
    try {
      if (isCreating) {
        const { error } = await supabase
          .from('promo_codes')
          .insert({
            ...promoCode,
            code: promoCode.code?.toUpperCase(),
          });

        if (error) {
          toast({
            title: "Erreur",
            description: "Impossible de créer le code promo",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Code créé",
          description: "Le code promo a été créé avec succès",
        });
      } else {
        const { error } = await supabase
          .from('promo_codes')
          .update({
            ...promoCode,
            code: promoCode.code?.toUpperCase(),
          })
          .eq('id', editingCode?.id);

        if (error) {
          toast({
            title: "Erreur",
            description: "Impossible de modifier le code promo",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Code modifié",
          description: "Le code promo a été mis à jour avec succès",
        });
      }

      setEditingCode(null);
      setIsCreating(false);
      fetchPromoCodes();
    } catch (error) {
      console.error('Error saving promo code:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive",
      });
    }
  };

  const deletePromoCode = async (id: string) => {
    try {
      const { error } = await supabase
        .from('promo_codes')
        .delete()
        .eq('id', id);

      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de supprimer le code promo",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Code supprimé",
        description: "Le code promo a été supprimé avec succès",
      });
      
      fetchPromoCodes();
    } catch (error) {
      console.error('Error deleting promo code:', error);
    }
  };

  const toggleCodeStatus = async (id: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from('promo_codes')
        .update({ active })
        .eq('id', id);

      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de modifier le statut",
          variant: "destructive",
        });
        return;
      }

      fetchPromoCodes();
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const handleCreate = () => {
    const newCode: Partial<PromoCode> = {
      code: generateRandomCode(),
      free_photos: 5,
      max_uses: null,
      current_uses: 0,
      active: true,
      expires_at: undefined,
    };
    setEditingCode(newCode as PromoCode);
    setIsCreating(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Codes Promo ({promoCodes.length})</h3>
        <Button onClick={handleCreate} className="bg-gradient-button">
          <Plus className="h-4 w-4 mr-2" />
          Créer un code
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {promoCodes.map((code) => (
          <Card key={code.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg font-mono">{code.code}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    {code.active ? (
                      <Badge className="bg-success text-success-foreground">
                        <Eye className="h-3 w-3 mr-1" />
                        Actif
                      </Badge>
                    ) : (
                      <Badge className="bg-destructive text-destructive-foreground">
                        <EyeOff className="h-3 w-3 mr-1" />
                        Inactif
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingCode(code);
                      setIsCreating(false);
                    }}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deletePromoCode(code.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-green-600" />
                <span className="text-sm">
                  <strong>{code.free_photos}</strong> photos gratuites
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm">
                  {code.current_uses} / {code.max_uses || '∞'} utilisations
                </span>
              </div>
              
              {code.expires_at && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-orange-600" />
                  <span className="text-sm">
                    Expire le {new Date(code.expires_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              )}
              
              <div className="pt-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`active-${code.id}`} className="text-sm">
                    Code actif
                  </Label>
                  <Switch
                    id={`active-${code.id}`}
                    checked={code.active}
                    onCheckedChange={(checked) => toggleCodeStatus(code.id, checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal d'édition */}
      {editingCode && (
        <PromoCodeEditModal
          promoCode={editingCode}
          isCreating={isCreating}
          onSave={savePromoCode}
          onCancel={() => {
            setEditingCode(null);
            setIsCreating(false);
          }}
        />
      )}
    </div>
  );
};

interface PromoCodeEditModalProps {
  promoCode: PromoCode;
  isCreating: boolean;
  onSave: (code: Partial<PromoCode>) => void;
  onCancel: () => void;
}

const PromoCodeEditModal = ({ promoCode, isCreating, onSave, onCancel }: PromoCodeEditModalProps) => {
  const [formData, setFormData] = useState(promoCode);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              {isCreating ? "Créer un code promo" : "Modifier le code promo"}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="code">Code promo</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                placeholder="PROMO2024"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="free_photos">Photos gratuites</Label>
              <Input
                id="free_photos"
                type="number"
                min="1"
                max="100"
                value={formData.free_photos}
                onChange={(e) => setFormData({...formData, free_photos: parseInt(e.target.value)})}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="max_uses">Utilisations max (optionnel)</Label>
              <Input
                id="max_uses"
                type="number"
                min="1"
                value={formData.max_uses || ''}
                onChange={(e) => setFormData({...formData, max_uses: e.target.value ? parseInt(e.target.value) : null})}
                placeholder="Illimité"
              />
            </div>
            
            <div>
              <Label htmlFor="expires_at">Date d'expiration (optionnel)</Label>
              <Input
                id="expires_at"
                type="datetime-local"
                value={formData.expires_at ? new Date(formData.expires_at).toISOString().slice(0, 16) : ''}
                onChange={(e) => setFormData({...formData, expires_at: e.target.value ? new Date(e.target.value).toISOString() : undefined})}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({...formData, active: checked})}
              />
              <Label htmlFor="active">Code actif</Label>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button 
                type="submit"
                className="bg-gradient-button hover:scale-105 transform transition-all duration-300 flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                {isCreating ? "Créer" : "Sauvegarder"}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Annuler
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PromoCodeManager;