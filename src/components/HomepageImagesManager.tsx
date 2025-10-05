import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import DynamicHomepageImagesManager from "@/components/DynamicHomepageImagesManager";

const HomepageImagesManager = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Images de la page d'accueil</CardTitle>
            <p className="text-sm text-muted-foreground">
              Gérez toutes les paires d'images "avant" et "après" de la page d'accueil
            </p>
          </div>
          <Button 
            onClick={() => {
              const addButton = document.querySelector('#add-dynamic-pair-button') as HTMLButtonElement;
              if (addButton) addButton.click();
            }}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Ajouter une paire
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <DynamicHomepageImagesManager />
      </CardContent>
    </Card>
  );
};

export default HomepageImagesManager;