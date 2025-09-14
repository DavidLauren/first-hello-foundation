import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Users, Search, Gift, TrendingUp } from 'lucide-react';

interface ReferralCode {
  id: string;
  user_id: string;
  code: string;
  created_at: string;
  is_active: boolean;
  profiles: {
    contact_name: string;
    email: string;
  };
}

interface ReferralDetail {
  id: string;
  referrer_id: string;
  referred_id: string;
  referral_code: string;
  reward_given_to_referrer: boolean;
  reward_given_to_referred: boolean;
  referrer_reward_amount: number;
  referred_reward_amount: number;
  created_at: string;
  referrer_profile: {
    contact_name: string;
    email: string;
  };
  referred_profile: {
    contact_name: string;
    email: string;
  };
}

const ReferralManager = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [referralCodes, setReferralCodes] = useState<ReferralCode[]>([]);
  const [referrals, setReferrals] = useState<ReferralDetail[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalReferrals: 0,
    totalRewards: 0,
    activeUsers: 0
  });

  const fetchReferralCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('referral_codes')
        .select(`
          *,
          profiles(contact_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching referral codes:', error);
        return;
      }

      setReferralCodes(data as any || []);
    } catch (error) {
      console.error('Error in fetchReferralCodes:', error);
    }
  };

  const fetchReferrals = async () => {
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select(`
          *,
          referrer_profile:referral_codes!referrals_referrer_id_fkey(user_id, profiles(contact_name, email)),
          referred_profile:profiles!referrals_referred_id_fkey(contact_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching referrals:', error);
        return;
      }

      setReferrals(data as any || []);

      // Calculer les statistiques
      const totalReferrals = data?.length || 0;
      const totalRewards = data?.reduce((sum, ref) => sum + (ref.referrer_reward_amount || 0), 0) || 0;
      const activeUsers = new Set(data?.map(ref => ref.referrer_id)).size;

      setStats({
        totalReferrals,
        totalRewards: Math.round(totalRewards / 100), // Convertir en euros
        activeUsers
      });
    } catch (error) {
      console.error('Error in fetchReferrals:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchReferralCodes(), fetchReferrals()]);
      setLoading(false);
    };

    loadData();
  }, []);

  const toggleCodeStatus = async (codeId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('referral_codes')
        .update({ is_active: !currentStatus })
        .eq('id', codeId);

      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de modifier le statut du code",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Statut modifié",
        description: `Le code a été ${!currentStatus ? 'activé' : 'désactivé'}`,
      });

      fetchReferralCodes();
    } catch (error) {
      console.error('Error toggling code status:', error);
    }
  };

  const filteredCodes = referralCodes.filter(code =>
    code.profiles?.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    code.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    code.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredReferrals = referrals.filter(referral =>
    referral.referrer_profile?.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    referral.referred_profile?.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    referral.referral_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Parrainages</p>
                <p className="text-2xl font-bold text-brand-primary">{stats.totalReferrals}</p>
              </div>
              <Users className="h-8 w-8 text-brand-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Récompenses Totales</p>
                <p className="text-2xl font-bold text-brand-primary">{stats.totalRewards}€</p>
              </div>
              <Gift className="h-8 w-8 text-brand-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Utilisateurs Actifs</p>
                <p className="text-2xl font-bold text-brand-primary">{stats.activeUsers}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-brand-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recherche */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, email ou code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Codes de parrainage */}
      <Card>
        <CardHeader>
          <CardTitle>Codes de Parrainage ({filteredCodes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredCodes.map((code) => (
              <div 
                key={code.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <p className="font-mono text-lg font-bold">{code.code}</p>
                    <Badge variant={code.is_active ? "default" : "secondary"}>
                      {code.is_active ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {code.profiles?.contact_name} ({code.profiles?.email})
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Créé le {new Date(code.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleCodeStatus(code.id, code.is_active)}
                >
                  {code.is_active ? 'Désactiver' : 'Activer'}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Historique des parrainages */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des Parrainages ({filteredReferrals.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredReferrals.map((referral) => (
              <div 
                key={referral.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">
                      {referral.referrer_profile?.contact_name}
                    </span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-medium">
                      {referral.referred_profile?.contact_name}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Code: {referral.referral_code} • 
                    {new Date(referral.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    Parrain: +{referral.referrer_reward_amount / 100}€
                  </Badge>
                  <Badge variant="secondary">
                    Filleul: +{referral.referred_reward_amount / 100}€
                  </Badge>
                  {referral.reward_given_to_referrer && (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      ✓ Payé
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReferralManager;