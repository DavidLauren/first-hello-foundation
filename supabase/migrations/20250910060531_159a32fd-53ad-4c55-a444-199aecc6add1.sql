-- Créer un trigger qui génère automatiquement un code de parrainage lors de la création d'un profil
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_user_referral_code();