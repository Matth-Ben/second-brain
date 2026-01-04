# 🔧 Configuration pour Production

## Problème : Variables d'environnement non disponibles en production

Le fichier `.env` n'est **pas inclus** dans le build Electron. Vous devez donc **hardcoder** vos credentials Supabase dans le code source.

## Solution 1 : Hardcoder les credentials (Recommandé pour usage personnel)

### Étape 1 : Récupérer vos credentials Supabase

1. Allez sur votre projet Supabase
2. **Settings** > **API**
3. Copiez :
   - **Project URL** (ex: `https://abcdefgh.supabase.co`)
   - **anon public** key (la longue clé qui commence par `eyJ...`)

### Étape 2 : Modifier `src/supabaseClient.js`

Remplacez les valeurs par défaut par vos vraies credentials :

```javascript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://VOTRE-PROJET.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

**Important** : 
- ✅ La clé `anon public` est **sécurisée** pour être exposée côté client
- ✅ En dev, le `.env` sera toujours utilisé en priorité
- ✅ En production, les valeurs hardcodées seront utilisées

### Étape 3 : Rebuild l'application

```bash
npm run electron:build
```

---

## Solution 2 : Utiliser un fichier de configuration externe (Avancé)

Si vous voulez éviter de hardcoder, vous pouvez créer un fichier `config.json` qui sera lu au runtime.

### Créer `public/config.json` :

```json
{
  "supabaseUrl": "https://votre-projet.supabase.co",
  "supabaseAnonKey": "votre-clé-anon"
}
```

### Modifier `src/supabaseClient.js` :

```javascript
import { createClient } from '@supabase/supabase-js'

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL
let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// En production, charger depuis config.json
if (import.meta.env.PROD) {
  try {
    const response = await fetch('/config.json')
    const config = await response.json()
    supabaseUrl = config.supabaseUrl
    supabaseAnonKey = config.supabaseAnonKey
  } catch (error) {
    console.error('Failed to load config:', error)
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

**Avantage** : Vous pouvez changer les credentials sans rebuild.

**Inconvénient** : Plus complexe à mettre en place.

---

## Vérification

Après le build, installez l'application et ouvrez la console développeur (F12) :

```
✅ Supabase URL configured: true
✅ Supabase Key configured: true
✅ Environment mode: production
```

Si vous voyez `false`, c'est que les credentials ne sont pas configurés.
