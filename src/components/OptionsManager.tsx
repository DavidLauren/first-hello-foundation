import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, Euro, Users, CreditCard, Download } from "lucide-react";
import PromoCodeManager from './PromoCodeManager';
import PriceManager from './PriceManager';
import ReferralManager from './ReferralManager';
import StripeManager from './StripeManager';
import EmailExportManager from './EmailExportManager';

const OptionsManager = () => {
  const [activeSubTab, setActiveSubTab] = useState<'promo' | 'pricing' | 'referral' | 'stripe' | 'export'>('promo');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            ⚙️ Options du Site
          </CardTitle>
          <p className="text-gray-600">
            Gérez les codes promo, prix et système de parrainage
          </p>
        </CardHeader>
        <CardContent>
          {/* Sous-onglets */}
          <div className="mb-6">
            <div className="flex gap-2 border-b">
              <Button
                variant={activeSubTab === 'promo' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveSubTab('promo')}
                className="flex items-center gap-2"
              >
                <Gift className="h-4 w-4" />
                Codes Promo
              </Button>
              <Button
                variant={activeSubTab === 'pricing' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveSubTab('pricing')}
                className="flex items-center gap-2"
              >
                <Euro className="h-4 w-4" />
                Prix
              </Button>
              <Button
                variant={activeSubTab === 'referral' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveSubTab('referral')}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Parrainage
              </Button>
              <Button
                variant={activeSubTab === 'stripe' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveSubTab('stripe')}
                className="flex items-center gap-2"
              >
                <CreditCard className="h-4 w-4" />
                Stripe
              </Button>
              <Button
                variant={activeSubTab === 'export' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveSubTab('export')}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          {/* Contenu des sous-onglets */}
          {activeSubTab === 'promo' && <PromoCodeManager />}
          {activeSubTab === 'pricing' && <PriceManager />}
          {activeSubTab === 'referral' && <ReferralManager />}
          {activeSubTab === 'stripe' && <StripeManager />}
          {activeSubTab === 'export' && <EmailExportManager />}
        </CardContent>
      </Card>
    </div>
  );
};

export default OptionsManager;