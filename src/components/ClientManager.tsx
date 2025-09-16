import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Crown, Star, Mail, Building2, Calendar, Users, UserCheck, Search, Trash2, StickyNote } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Profile {
  id: string;
  email: string;
  contact_name: string;
  company_name?: string;
  is_vip: boolean;
  deferred_billing_enabled: boolean;
  billing_address?: string;
  billing_company?: string;
  vip_activated_at?: string;
  created_at: string;
  admin_notes?: string;
}

const ClientManager = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [billingInfo, setBillingInfo] = useState({
    billing_address: '',
    billing_company: ''
  });
  const [notesProfile, setNotesProfile] = useState<Profile | null>(null);
  const [notes, setNotes] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des profils:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger la liste des clients",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleVipStatus = async (profileId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_vip: !currentStatus,
          vip_activated_at: !currentStatus ? new Date().toISOString() : null,
          vip_activated_by: !currentStatus ? user?.id : null
        })
        .eq('id', profileId);

      if (error) throw error;

      await fetchProfiles();
      toast({
        title: "Statut VIP mis à jour",
        description: `Le client est maintenant ${!currentStatus ? 'VIP' : 'standard'}`,
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut VIP:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut VIP",
        variant: "destructive",
      });
    }
  };

  const updateBillingInfo = async () => {
    if (!selectedProfile) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          billing_address: billingInfo.billing_address,
          billing_company: billingInfo.billing_company
        })
        .eq('id', selectedProfile.id);

      if (error) throw error;

      await fetchProfiles();
      setSelectedProfile(null);
      setBillingInfo({ billing_address: '', billing_company: '' });
      
      toast({
        title: "Informations de facturation mises à jour",
        description: "Les informations ont été sauvegardées avec succès",
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les informations",
        variant: "destructive",
      });
    }
  };

  const updateNotes = async () => {
    if (!notesProfile) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          admin_notes: notes
        })
        .eq('id', notesProfile.id);

      if (error) throw error;

      await fetchProfiles();
      setNotesProfile(null);
      setNotes('');
      
      toast({
        title: "Notes mises à jour",
        description: "Les notes ont été sauvegardées avec succès",
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour des notes:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les notes",
        variant: "destructive",
      });
    }
  };

  const deleteClient = async (profileId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('delete-client-admin', {
        body: { userId: profileId },
      });

      if (error) throw error;
      if (data && (data as any).success === false) {
        throw new Error((data as any).error || 'Erreur lors de la suppression');
      }

      await fetchProfiles();
      toast({
        title: 'Client supprimé',
        description: 'Le client et ses données associées ont été supprimés',
      });
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: 'Erreur',
        description: "Impossible de supprimer le client",
        variant: 'destructive',
      });
    }
  };

  const filteredProfiles = profiles.filter(profile =>
    profile.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (profile.company_name && profile.company_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des Clients</h2>
          <p className="text-gray-600">Gérez les statuts VIP et les préférences de facturation</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="gap-2">
            <Users className="h-4 w-4" />
            {profiles.length} clients
          </Badge>
          <Badge variant="outline" className="gap-2">
            <Crown className="h-4 w-4 text-yellow-500" />
            {profiles.filter(p => p.is_vip).length} VIP
          </Badge>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Rechercher par email, nom ou entreprise..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tableau des clients */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Liste des Clients
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Entreprise</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Membre depuis</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProfiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {profile.is_vip && <Crown className="h-4 w-4 text-yellow-500" />}
                      <span className="font-medium">{profile.contact_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      {profile.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    {profile.company_name ? (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        {profile.company_name}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={profile.is_vip ? "default" : "secondary"}
                        className={profile.is_vip ? "bg-yellow-100 text-yellow-800 border-yellow-300" : ""}
                      >
                        {profile.is_vip ? (
                          <>
                            <Crown className="h-3 w-3 mr-1" />
                            VIP
                          </>
                        ) : (
                          'Standard'
                        )}
                      </Badge>
                      {profile.deferred_billing_enabled && (
                        <Badge variant="outline" className="text-blue-600 border-blue-300">
                          Facturation différée
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {new Date(profile.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={profile.is_vip ? "outline" : "default"}
                        onClick={() => toggleVipStatus(profile.id, profile.is_vip)}
                        className={profile.is_vip ? "" : "bg-yellow-500 hover:bg-yellow-600"}
                      >
                        {profile.is_vip ? (
                          <>
                            <Star className="h-4 w-4 mr-1" />
                            Retirer VIP
                          </>
                        ) : (
                          <>
                            <Crown className="h-4 w-4 mr-1" />
                            Activer VIP
                          </>
                        )}
                      </Button>
                      
                      {profile.is_vip && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedProfile(profile);
                                setBillingInfo({
                                  billing_address: profile.billing_address || '',
                                  billing_company: profile.billing_company || ''
                                });
                              }}
                            >
                              Facturation
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Informations de facturation - {profile.contact_name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="billing_company">Société de facturation</Label>
                                <Input
                                  id="billing_company"
                                  value={billingInfo.billing_company}
                                  onChange={(e) => setBillingInfo(prev => ({ ...prev, billing_company: e.target.value }))}
                                  placeholder="Nom de la société"
                                />
                              </div>
                              <div>
                                <Label htmlFor="billing_address">Adresse de facturation</Label>
                                <Textarea
                                  id="billing_address"
                                  value={billingInfo.billing_address}
                                  onChange={(e) => setBillingInfo(prev => ({ ...prev, billing_address: e.target.value }))}
                                  placeholder="Adresse complète de facturation"
                                  rows={3}
                                />
                              </div>
                              <div className="flex gap-2 pt-4">
                                <Button onClick={updateBillingInfo} className="flex-1">
                                  Sauvegarder
                                </Button>
                                <Button variant="outline" onClick={() => setSelectedProfile(null)} className="flex-1">
                                  Annuler
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setNotesProfile(profile);
                              setNotes(profile.admin_notes || '');
                            }}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <StickyNote className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Notes administratives - {profile.contact_name}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="admin_notes">Notes internes</Label>
                              <Textarea
                                id="admin_notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Ajoutez des notes sur ce client (comportement, préférences, historique...)"
                                rows={6}
                                className="resize-none"
                              />
                              <p className="text-sm text-gray-500 mt-1">
                                Ces notes ne sont visibles que par les administrateurs
                              </p>
                            </div>
                            <div className="flex gap-2 pt-4">
                              <Button onClick={updateNotes} className="flex-1">
                                Sauvegarder
                              </Button>
                              <Button variant="outline" onClick={() => setNotesProfile(null)} className="flex-1">
                                Annuler
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:text-destructive hover:bg-destructive/5"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer le client</AlertDialogTitle>
                            <AlertDialogDescription>
                              Êtes-vous sûr de vouloir supprimer le client <strong>{profile.contact_name}</strong> ? 
                              Cette action est irréversible et supprimera toutes les données associées.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteClient(profile.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              aria-label={`Supprimer le client ${profile.contact_name}`}
                            >
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredProfiles.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'Aucun client trouvé pour cette recherche' : 'Aucun client enregistré'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientManager;