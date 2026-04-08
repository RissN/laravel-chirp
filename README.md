# Chirp 🐦 - Modern Social Media Platform

![Chirp Preview](https://img.shields.io/badge/Status-Beta-brightgreen)
![Laravel](https://img.shields.io/badge/Backend-Laravel%2012-FF2D20?logo=laravel)
![React](https://img.shields.io/badge/Frontend-React%2019-61DAFB?logo=react)
![Real-time](https://img.shields.io/badge/Real--time-Laravel%20Reverb-4053D6?logo=laravel)

**Chirp** is a premium, feature-rich social media application inspired by Twitter/X. Built with a focus on speed, aesthetics, and real-time interaction, it provides a seamless user experience for sharing thoughts, media, and connecting with others.

## ✨ Key Features

### 📨 Social Interaction
- **Real-time Timeline**: See tweets from people you follow instantly with optimized loading.
- **Rich Tweeting**: Post text and multiple images with automatic storage management.
- **Interactions**: Like, Retweet, Quote, and Reply to tweets with optimistic UI updates.
- **Hashtags & Trending**: Dynamic trending system based on hashtag frequency.
- **Bookmarks**: Save your favorite tweets for later.

### 🔔 Real-time Notifications & Messaging
- **Instant Notifications**: Get notified immediately for likes, retweets, or follows (powered by Laravel Reverb).
- **Advanced Direct Messaging**: Private, real-time chat with a sleek glassmorphism UI and user discovery search.

### 👤 Profile & Personalization
- **Full Profile Customization**: Update BIOS, Location, Website, and upload Avatars & Header banners.
- **Dark/Light Mode**: Sleek themes that persist across sessions.
- **Account Privacy**: Clean authentication system powered by Laravel Sanctum.

### 🛡️ Administration & Moderation
- **Management Dashboard**: Comprehensive admin panel for overviewing platform health.
- **User Management**: Tools to manage accounts, roles, and permissions.
- **Moderation System**: Robust reporting system for content and user behavior.
- **Audit Logs**: Detailed tracking of administrative actions for accountability.
- **Community Safety**: Built-in reporting mechanism to keep the platform safe.

### 🔍 Discovery
- **Global Search**: Find users and tweets across the entire platform.
- **Explore Page**: Discover new content and trending topics.

## 🎨 Design Philosophy
- **Premium Aesthetics**: Modern, clean design using TailWind CSS and Framer Motion.
- **Glassmorphism**: Elegant translucent UI elements for a high-end feel.
- **Micro-animations**: Smooth transitions and interactive feedback throughout the app.

## 🛠️ Technology Stack

### Backend
- **Laravel 12**: Robust PHP framework for the REST API.
- **Laravel Sanctum**: Secure token-based authentication.
- **Laravel Reverb**: High-performance WebSocket server.
- **MySQL**: Relational database for data persistence.

### Frontend
- **React 19**: Modern UI library with the latest Concurrent features.
- **Vite**: Ultra-fast build tool and development server.
- **Zustand**: Lightweight, high-performance state management.
- **TanStack Query (v5)**: Efficient server-state management and caching.
- **Tailwind CSS**: Premium, utility-first styling with custom themes.
- **Framer Motion**: State-of-the-art animations and transitions.

---

## 🚀 Getting Started

### Prerequisites
- PHP 8.2+
- Composer
- Node.js & npm
- MySQL / MariaDB

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/chirp-fullstack.git
   cd chirp-fullstack
   ```

2. **Backend Setup**
   ```bash
   cd chirp-api
   composer install
   cp .env.example .env
   php artisan key:generate
   ```
   *Configure your database settings in `.env` then:*
   ```bash
   php artisan migrate --seed
   php artisan storage:link
   ```

3. **Frontend Setup**
   ```bash
   cd ../chirp-frontend
   npm install
   ```

### Running the Application

1. **Start Backend API**
   ```bash
   # In chirp-api
   php artisan serve
   ```

2. **Start WebSocket Server**
   ```bash
   # In chirp-api
   php artisan reverb:start
   ```

3. **Start Frontend App**
   ```bash
   # In chirp-frontend
   npm run dev
   ```

---

## 🛡️ License
Distributed under the MIT License. See `LICENSE` for more information.

## 🤝 Contributing
Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

---
*Built with ❤️ by Antigravity*
