# List Management App

A React application for managing lists with drag and drop functionality.

## Features

- User authentication with email
- Group management (create, edit, delete)
- List management within groups
- Drag and drop for lists and symbols
- Real-time database updates using Supabase
- Responsive design

## Tech Stack

- React
- react-beautiful-dnd for drag and drop
- Supabase for database and authentication
- CSS for styling

## Getting Started

1. Clone the repository
```bash
git clone [your-repo-url]
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Create a `.env` file in the root directory and add your Supabase credentials:
```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server
```bash
npm start
```

## Usage

1. Sign up or log in with your email
2. Create groups to organize your lists
3. Add lists within groups
4. Add symbols to lists
5. Drag and drop to reorder lists or move symbols between lists

## Project Structure

- `/src/components` - React components
- `/src/components/ListManagement.js` - Main list management component
- `/src/components/Navigation.js` - Navigation component
- `/src/supabaseClient.js` - Supabase client configuration
