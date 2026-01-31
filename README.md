# Face Mash 

A fun web app where two faces go head-to-head and users choose the winner. Each person has a dynamic rating that increases when they win matchups. Over time, the leaderboard ranks the highest-rated faces.

Built with a modern web stack and powered by Supabase for real-time data and storage.

## 🚀 Features

⚔️ Face Matchups – Two random faces appear, users vote for the better one

📈 Dynamic Rating System – Winners gain rating points

🏆 Leaderboard – See top-ranked faces

👤 Profile Pages – Click a person to view their profile

🖼️ Photo Gallery per Person – Each profile has a gallery of their photos

⬆️ Photo Uploads – Add more photos to any person

☁️ Supabase Backend – Database + image storage

## 🧠 How It Works

Two people are selected from the database.

The user clicks the face they think should win.

The winner’s rating increases.

The leaderboard updates based on ratings.

Each person has a profile with a gallery of all their uploaded images.

## 🛠 Tech Stack

Frontend

React + Vite

TypeScript

CSS / Tailwind (if used)

Backend / Database

Supabase (PostgreSQL)

Supabase Storage (for image uploads)

Hosting

Netlify/Vercel

## 🗄 Database Structure (Supabase)
### people table
Column	Type	Description
id	uuid	Primary key
name	text	Person’s name
rating	int	Current score
created_at	timestamp	Created time
### photos table
Column	Type	Description
id	uuid	Primary key
person_id	uuid	References people.id
image_url	text	Image stored in Supabase Storage
created_at	timestamp	Upload time

Each person can have multiple photos linked via person_id.

### 📦 Installation (Local Development)
git clone https://github.com/your-username/face-fight-club.git
cd face-fight-club
npm install
npm run dev


Create a .env file:

VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
