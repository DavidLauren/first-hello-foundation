import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const usePricing = () => {
  const [pricePerPhoto, setPricePerPhoto] = useState<number>(14);
  const [loading, setLoading] = useState(true);

  const fetchPrice = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'price_per_photo')
        .maybeSingle();

      if (error) {
        console.error('Error fetching price:', error);
        setPricePerPhoto(13); // Fallback to default
      } else {
        setPricePerPhoto(parseInt(data?.setting_value || '13'));
      }
    } catch (error) {
      console.error('Error fetching price:', error);
      setPricePerPhoto(13); // Fallback to default
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrice();
  }, []);

  return {
    pricePerPhoto,
    loading,
    refetch: fetchPrice
  };
};