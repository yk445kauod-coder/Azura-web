# Firebase Realtime Database Structure

To ensure the app functions correctly, your Firebase RTDB should follow this structure:

## 📂 Data Nodes

### `/users`
Stores user activity and metadata.
- `loginCount`: (number)
- `lastLoginAt`: (ISO timestamp)
- `totalUsageSeconds`: (number)
- `status`: "online" | "offline"
- `deviceId`: (string)

### `/chats`
Stores AI conversation history.
- `userId`:
  - `messages`: [ { role: "user" | "assistant", content: "..." } ]

### `/settings`
Stores application configuration.
- `geminiKey`: (Your Groq API Key)
- `aiEnabled`: (boolean)

## 🔐 Security Rules
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```
*(Note: In production, refine these rules to restrict `/settings` to admin only).*
