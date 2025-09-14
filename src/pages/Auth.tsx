import { useState, useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Building2, Mail, Lock, User, Phone, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import Layout from '@/components/Layout';

const Auth = () => {
  const { user, signIn, signUp, loading } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("signup");

  // Déterminer l'onglet initial basé sur l'URL ou les paramètres
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'signin') {
      setActiveTab('signin');
    } else {
      setActiveTab('signup'); // Par défaut sur inscription
    }
  }, [searchParams]);
  
  // Redirect if already authenticated
  if (user && !loading) {
    return <Navigate to="/account?tab=upload" replace />;
  }
  
  // Fonction pour traduire les erreurs Supabase en français
  const translateError = (errorMessage: string) => {
    const errorTranslations: { [key: string]: string } = {
      'Invalid login credentials': 'Email ou mot de passe incorrect',
      'Email not confirmed': 'Veuillez confirmer votre email avant de vous connecter',
      'User already registered': 'Un compte existe déjà avec cet email',
      'Password should be at least 6 characters': 'Le mot de passe doit contenir au moins 6 caractères',
      'Invalid email': 'Format d\'email invalide',
      'Email address is invalid': 'Format d\'email invalide',
      'Signup is disabled': 'Les inscriptions sont temporairement désactivées',
      'Too many requests': 'Trop de tentatives, veuillez réessayer plus tard',
      'Network error': 'Erreur de connexion réseau',
    };
    
    // Chercher une traduction exacte
    for (const [english, french] of Object.entries(errorTranslations)) {
      if (errorMessage.includes(english)) {
        return french;
      }
    }
    
    // Si pas de traduction trouvée, retourner le message original avec un préfixe
    return `Erreur : ${errorMessage}`;
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await signIn(email, password);
    
    if (error) {
      toast({
        title: "🚨 Erreur de connexion",
        description: translateError(error.message),
        variant: "destructive",
        duration: 5000,
      });
    } else {
      toast({
        title: "✅ Connexion réussie",
        description: "Bienvenue ! Vous êtes maintenant connecté.",
        duration: 3000,
      });
    }
    
    setIsSubmitting(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    const contactName = formData.get('contactName') as string;
    const companyName = formData.get('companyName') as string;

    // Validation des mots de passe
    if (password.length < 8) {
      toast({
        title: "⚠️ Mot de passe trop court",
        description: "Le mot de passe doit contenir au moins 8 caractères pour garantir la sécurité de votre compte.",
        variant: "destructive",
        duration: 5000,
      });
      setIsSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "⚠️ Mots de passe différents",
        description: "Les mots de passe ne correspondent pas. Veuillez vérifier et ressaisir.",
        variant: "destructive",
        duration: 5000,
      });
      setIsSubmitting(false);
      return;
    }

    const { error } = await signUp(email, password, contactName, companyName);
    
    if (error) {
      toast({
        title: "🚨 Erreur d'inscription",
        description: translateError(error.message),
        variant: "destructive",
        duration: 5000,
      });
    } else {
      toast({
        title: "🎉 Inscription réussie",
        description: "Votre compte a été créé ! Vérifiez votre email pour le confirmer et vous connecter.",
        duration: 5000,
        className: "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 max-w-md w-full",
      });
    }
    
    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">CrazyPixels</h1>
            <p className="text-muted-foreground">Retouche Photo Professionnelle</p>
          </div>

          <Card className="shadow-card">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Espace Client</CardTitle>
              <CardDescription>
                Connectez-vous ou créez votre compte professionnel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Connexion</TabsTrigger>
                  <TabsTrigger value="signup">Inscription</TabsTrigger>
                </TabsList>
                
                <TabsContent value="signin" className="space-y-4">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signin-email"
                          name="email"
                          type="email"
                          placeholder="votre@email.com"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Mot de passe</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signin-password"
                          name="password"
                          type={showSignInPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="pl-10 pr-10"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignInPassword(!showSignInPassword)}
                          className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showSignInPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-brand-primary hover:bg-brand-primary/90"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Connexion..." : "Se connecter"}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup" className="space-y-4">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-email"
                          name="email"
                          type="email"
                          placeholder="contact@entreprise.com"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-contact">Nom du contact</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-contact"
                          name="contactName"
                          type="text"
                          placeholder="Jean Dupont"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-company">Nom de l'entreprise <span className="text-muted-foreground text-sm">(Facultatif)</span></Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-company"
                          name="companyName"
                          type="text"
                          placeholder="Nom de votre entreprise"
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Mots de passe</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-password"
                          name="password"
                          type={showSignUpPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="pl-10 pr-10"
                          minLength={8}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                          className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showSignUpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground">Minimum 8 caractères</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm-password">Confirmation du mots de passe</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-confirm-password"
                          name="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="pl-10 pr-10"
                          minLength={8}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-brand-accent hover:bg-brand-accent/90"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Création..." : "Créer mon compte"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Auth;