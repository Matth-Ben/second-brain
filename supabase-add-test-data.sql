-- Script pour ajouter des données de test
-- Exécutez ce script dans le SQL Editor de Supabase

-- IMPORTANT: Remplacez 'VOTRE-USER-ID' par votre vrai user_id
-- Vous pouvez le trouver en regardant la console de l'app (ligne "Fetching tasks for user: ...")

-- Ajouter une tâche de test
INSERT INTO tasks (user_id, title, is_done, category)
VALUES 
  ('VOTRE-USER-ID', 'Tâche de test 1', false, 'work'),
  ('VOTRE-USER-ID', 'Tâche de test 2', false, 'personal'),
  ('VOTRE-USER-ID', 'Tâche terminée', true, 'work');

-- Ajouter une note de test
INSERT INTO notes (user_id, title, content)
VALUES 
  ('VOTRE-USER-ID', 'Note de test', 'Ceci est une note de test pour vérifier que tout fonctionne.');

-- Vérifier que les données ont été ajoutées
SELECT * FROM tasks WHERE user_id = 'VOTRE-USER-ID';
SELECT * FROM notes WHERE user_id = 'VOTRE-USER-ID';
