# Second Brain - Desktop Productivity App

A modern, offline-first capability desktop productivity application built with React, Electron, and Supabase.

## Features

- **Task Management**: Create, organize, and track tasks with categories (Work/Personal). Export to Google Calendar or .ics.
- **Advanced Notes**: Rich text editor (Tiptap) with **syntax highlighting**, image support, and auto-save.
- **Organization**: Pin your most important notes to favorites.
- **Theming**: Beautiful **Light**, **Dark**, and **System** themes with a fully adaptive UI.
- **Auto-Updates**: Seamless background updates for the desktop application.
- **Authentication**: Secure login and signup with Supabase.
- **Cross-Platform**: Works on Windows and macOS.

## Tech Stack

- **Frontend**: React + Vite
- **Desktop**: Electron + Electron Updater
- **Backend/Auth**: Supabase
- **Styling**: Tailwind CSS
- **Editor**: Tiptap + Lowlight
- **Routing**: React Router DOM
- **Icons**: Lucide React

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure Supabase**:
   - Copy `.env.example` to `.env`
   - Add your Supabase URL and Anon Key

3. **Database Setup**:
   Create these tables in your Supabase project:

   ```sql
   -- Tasks table
   create table tasks (
     id uuid default gen_random_uuid() primary key,
     user_id uuid references auth.users not null,
     title text not null,
     is_done boolean default false,
     category text check (category in ('work', 'personal')),
     due_date date,
     created_at timestamp with time zone default timezone('utc'::text, now()) not null
   );

   -- Notes table
   create table notes (
     id uuid default gen_random_uuid() primary key,
     user_id uuid references auth.users not null,
     title text not null,
     content text,
     is_favorite boolean default false,
     updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
     created_at timestamp with time zone default timezone('utc'::text, now()) not null
   );

   -- Note images storage bucket
   insert into storage.buckets (id, name, public) values ('note-images', 'note-images', true);

   -- Enable RLS
   alter table tasks enable row level security;
   alter table notes enable row level security;

   -- Tasks policies
   create policy "Users can view own tasks" on tasks for select using (auth.uid() = user_id);
   create policy "Users can insert own tasks" on tasks for insert with check (auth.uid() = user_id);
   create policy "Users can update own tasks" on tasks for update using (auth.uid() = user_id);
   create policy "Users can delete own tasks" on tasks for delete using (auth.uid() = user_id);

   -- Notes policies
   create policy "Users can view own notes" on notes for select using (auth.uid() = user_id);
   create policy "Users can insert own notes" on notes for insert with check (auth.uid() = user_id);
   create policy "Users can update own notes" on notes for update using (auth.uid() = user_id);
   create policy "Users can delete own notes" on notes for delete using (auth.uid() = user_id);
   
   -- Storage policies
   create policy "Users can upload own note images" on storage.objects for insert with check (bucket_id = 'note-images' and auth.uid()::text = (storage.foldername(name))[1]);
   create policy "Users can view own note images" on storage.objects for select using (bucket_id = 'note-images');
   create policy "Users can delete own note images" on storage.objects for delete using (bucket_id = 'note-images' and auth.uid()::text = (storage.foldername(name))[1]);
   ```

## Development

**Run web version**:
```bash
npm run dev
```

**Run Electron app**:
```bash
npm run electron:dev
```

## Build

**Build for production**:
```bash
npm run electron:build
```

## Project Structure

```
second-brain-app/
├── electron/           # Electron main process
├── src/
│   ├── components/     # React components
│   ├── pages/          # Page components
│   ├── contexts/       # React Contexts (Theme, etc.)
│   ├── App.jsx         # Main app with routing
│   ├── supabaseClient.js
│   └── main.jsx
├── package.json
└── vite.config.js
```

## License

MIT
