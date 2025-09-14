import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useReferral } from '@/hooks/useReferral';
import { Users, Gift, Copy, Share2 } from 'lucide-react';

const ReferralSection = () => {
  const { stats, referrals, loading, applyReferralCode, copyReferralCode } = useReferral();
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [applying, setApplying] = useState(false);

  const handleApplyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referralCodeInput.trim()) return;

    setApplying(true);
    const success = await applyReferralCode(referralCodeInput);
    if (success) {
      setReferralCodeInput('');
    }
    setApplying(false);
  };

  const shareReferralCode = async () => {
    if (!stats?.referral_code) return;

    const shareText = `Rejoignez-moi sur cette plateforme de retouche photo ! Utilisez mon code de parrainage ${stats.referral_code} et recevez des photos gratuites !`;
    const shareUrl = `${window.location.origin}?ref=${stats.referral_code}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Code de parrainage',
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        console.log('Partage annulé');
      }
    } else {
      // Fallback: copier le lien dans le presse-papiers
      try {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        // Toast déjà géré par copyReferralCode
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mon code de parrainage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-brand-primary" />
            Mon Code de Parrainage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {stats?.referral_code ? (
            <>
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-brand-primary/10 to-brand-secondary/10 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Votre code unique</p>
                  <p className="text-2xl font-bold text-brand-primary tracking-wider">
                    {stats.referral_code}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyReferralCode}
                    className="flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={shareReferralCode}
                    className="flex items-center gap-2"
                  >
                    <Share2 className="h-4 w-4" />
                    Partager
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-brand-primary">{stats.referrals_count}</p>
                  <p className="text-sm text-muted-foreground">Parrainages</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-brand-primary">{Math.round(stats.total_rewards || 0)}</p>
                  <p className="text-sm text-muted-foreground">Photos gagnées</p>
                </div>
              </div>

              <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                <p className="font-medium mb-1">💡 Comment ça marche :</p>
                <ul className="space-y-1 text-xs">
                  <li>• Partagez votre code avec vos amis</li>
                  <li>• Ils reçoivent 2 photos gratuites à l'inscription</li>
                  <li>• Vous recevez 3 photos gratuites par parrainage</li>
                </ul>
              </div>
            </>
          ) : (
            <div className="text-center p-4 text-muted-foreground">
              <p>Chargement de votre code de parrainage...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Utiliser un code de parrainage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-brand-primary" />
            Utiliser un Code de Parrainage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleApplyCode} className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Vous avez un code de parrainage ? Saisissez-le pour recevoir des photos gratuites !
              </p>
              <div className="flex gap-2">
                <Input
                  value={referralCodeInput}
                  onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                  placeholder="Entrez le code de parrainage"
                  maxLength={8}
                  className="uppercase tracking-wider"
                />
                <Button 
                  type="submit" 
                  disabled={!referralCodeInput.trim() || applying}
                  className="bg-gradient-button hover:scale-105 transform transition-all duration-300"
                >
                  {applying ? 'Application...' : 'Appliquer'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Mes parrainages */}
      {referrals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-brand-primary" />
              Mes Parrainages ({referrals.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {referrals.map((referral) => (
                <div 
                  key={referral.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">
                      {referral.profiles?.contact_name || 'Utilisateur'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(referral.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      +3 photos
                    </Badge>
                    {referral.reward_given_to_referrer && (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        ✓ Récompense reçue
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReferralSection;