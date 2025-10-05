import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { User, Mail } from "lucide-react";
import PromoCodeSection from "@/components/PromoCodeSection";
import PhotoUploadSection from "@/components/PhotoUploadSection";
import VipSection from "@/components/VipSection";
import DeferredBillingCounter from "@/components/DeferredBillingCounter";
import ReferralSection from "@/components/ReferralSection";
import UserOrdersViewer from "@/components/UserOrdersViewer";
import UserInvoicesViewer from "@/components/UserInvoicesViewer";
import ProfileEditor from "@/components/ProfileEditor";
import { UserChargesViewer } from "@/components/UserChargesViewer";

const AccountPage = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              👤 Mon Compte
            </h1>
            <p className="text-gray-600">
              Gérez vos commandes et informations personnelles
            </p>
          </div>

          <Tabs defaultValue="orders" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="orders">Mes Commandes</TabsTrigger>
              <TabsTrigger value="invoices">Mes Factures</TabsTrigger>
              <TabsTrigger value="charges">Sommes à régler</TabsTrigger>
              <TabsTrigger value="upload">Nouvelle Commande</TabsTrigger>
              <TabsTrigger value="profile">Mon Profil</TabsTrigger>
            </TabsList>

            <TabsContent value="orders" className="space-y-6">
              <UserOrdersViewer />
            </TabsContent>

            <TabsContent value="invoices" className="space-y-6">
              <UserInvoicesViewer />
            </TabsContent>

            <TabsContent value="charges" className="space-y-6">
              <UserChargesViewer />
            </TabsContent>

            <TabsContent value="upload" className="space-y-6">
              {/* Section upload de photos */}
              <PhotoUploadSection />
              
              {/* Section VIP */}
              <VipSection />
              
              {/* Compteur de facturation différée */}
              <DeferredBillingCounter />
            </TabsContent>

            <TabsContent value="profile" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Informations du compte modifiables */}
                <div className="space-y-6">
                  <ProfileEditor />
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Informations du compte
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Mail className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="font-medium">{user.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <User className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-600">Membre depuis</p>
                          <p className="font-medium">
                            {new Date(user.created_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Section codes promo et parrainage */}
                <div className="space-y-6">
                  <PromoCodeSection />
                  <ReferralSection />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default AccountPage;