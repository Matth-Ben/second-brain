-- Script de test rapide pour vérifier vos données Supabase
-- Exécutez ce script dans le SQL Editor de Supabase

-- 1. Vérifier les utilisateurs
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC;

-- 2. Compter les tâches par utilisateur
SELECT user_id, COUNT(*) as nb_tasks
FROM tasks
GROUP BY user_id;

-- 3. Voir toutes les tâches (sans RLS)
SELECT * FROM tasks;

-- 4. Voir toutes les notes (sans RLS)
SELECT * FROM notes;

-- 5. Vérifier les politiques RLS
SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename IN ('tasks', 'notes')
ORDER BY tablename, policyname;

-- 6. Tester si RLS bloque l'accès
-- Si cette requête retourne des résultats mais pas dans l'app, c'est un problème RLS
SET ROLE authenticated;
SELECT * FROM tasks WHERE user_id = auth.uid();
