# System Design & Architecture

## 🏛 Architecture
The project follows a modular React architecture focused on performance and real-time synchronization.

### 1. State Management
- **Context API**: Handles global state for Authentication (`AuthContext`), Cart, and AI settings.
- **Firebase Realtime Database**: Acts as the single source of truth for menu data, user logs, and AI chat history.

### 2. UI/UX Philosophy
- **Comfort First**: Uses `IBM Plex Sans Arabic` to ensure readability.
- **Mobile Optimized**: Redesigned modals as "Bottom Sheets" for thumb-friendly interaction.
- **Visual Feedback**: Shimmer effects on loading and hover shine on interactive elements.

### 3. User Tracking Mechanism (Heartbeat)
- **Concept**: To measure "Who is using the app a lot", a heartbeat interval is established.
- **Implementation**: Every 30 seconds, if the window is active, the app increments `totalUsageSeconds` in the user's Firebase node.
- **Metrics**: Tracks `loginCount`, `lastLoginAt`, and `totalUsageSeconds` per `deviceId`.

### 4. AI Gateway
- **Primary**: Groq API (`llama-3.3-70b-versatile`) for high-speed, intelligent responses.
- **Fallback**: Pollinations.ai text API for high availability.
- **Persistence**: Chat history is synced to `/chats/{userId}` in Realtime Database to survive refreshes.
