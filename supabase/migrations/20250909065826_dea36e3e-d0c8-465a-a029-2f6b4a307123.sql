-- Attribuer le rôle admin à l'utilisateur leroydavid@hotmail.fr
UPDATE public.user_roles 
SET role = 'admin' 
WHERE user_id = '8405be03-ad41-4618-953c-5508e8df33e7';

-- Vérifier que le rôle a été attribué
SELECT ur.role, u.email 
FROM public.user_roles ur 
JOIN auth.users u ON ur.user_id = u.id 
WHERE u.email = 'leroydavid@hotmail.fr';