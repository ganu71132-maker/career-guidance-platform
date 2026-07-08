# NextraPath: Interview Q&A Cheat Sheet

Congratulations on landing the interview! Since you built this project using AI assistance, it is incredibly important that you understand the underlying concepts so you can speak about them confidently.

Use this document to prepare for technical questions about your project.

---

### 1. What tech stack did you use to build NextraPath?
**Answer:** 
"I built NextraPath as a modern, serverless web application. 
- **Frontend:** I used **React.js** built with **Vite** for fast compilation, and **Tailwind CSS** for responsive styling. 
- **Backend & Database:** Instead of writing a traditional Node.js backend, I used **Supabase**, which provides a fully managed **PostgreSQL** database and instant APIs.
- **Hosting:** The frontend is deployed statically (e.g., Vercel/Netlify/GitHub Pages)."

---

### 2. Why did you choose Supabase instead of building your own backend?
**Answer:**
"As a solo developer, speed and security were my top priorities. Supabase gives me a production-ready PostgreSQL database with built-in authentication and Row Level Security (RLS). This allowed me to focus heavily on the user experience and frontend features without worrying about managing database servers, writing complex API endpoints, or handling password hashing."

---

### 3. How did you implement Authentication, specifically 'Sign in with Google'?
**Answer:**
"I used Supabase Auth. I configured the Google OAuth provider in my Supabase dashboard by supplying my Google Cloud Client ID and Secret. 
In the React code, I created an `AuthContext` using React's Context API to manage the user's session globally. When a user clicks 'Continue with Google', my app calls `supabase.auth.signInWithOAuth({ provider: 'google' })`. Supabase handles the secure redirect to Google, verifies their identity, and automatically creates a row in my `users` table if they are a new user, or logs them in if they are returning."

---

### 4. NextraPath features an Interactive Coding Workspace. How did you build that without paying for expensive cloud servers to execute user code?
**Answer:**
"Running user code on a backend server is very expensive and poses major security risks. To solve this, I engineered a **Browser-Based Execution** environment using **WebAssembly**.
For Python, I integrated **Pyodide**, which compiles the CPython interpreter into WebAssembly so it runs directly inside the user's browser. For SQL, I used **sql.js** (SQLite in WebAssembly). This means when a user writes and runs code, it executes entirely using their own computer's memory and CPU, resulting in zero server costs and instantaneous feedback."

---

### 5. How are you managing state across the application?
**Answer:**
"I used React's **Context API** combined with custom hooks (`useAuth` and `useData`). 
- `AuthContext` listens to Supabase's authentication state changes and provides the current user profile (like their name, role, and ID) to any component that needs it.
- `DataContext` acts as a global store for the career roadmaps, courses, and skills, preventing me from having to pass props down through multiple layers of components (avoiding prop drilling)."

---

### 6. I see you have a Resume Builder. How did you handle generating the PDF?
**Answer:**
"The Resume Builder is a React component that relies heavily on controlled state to update the UI in real-time as the user types. For the PDF generation, instead of generating it on a server, I utilized browser-native CSS print media queries (`@media print`). I wrote specific CSS rules to hide the sidebar and navigation during printing, and removed the `@page` margins so the resume occupies the full A4 page perfectly when the user clicks 'Download PDF'."

---

### 7. What was the biggest technical challenge you faced while building this, and how did you overcome it?
**Answer (Option A - The Resume Builder Bug):**
"One tricky bug involved the Resume Builder. Users complained that if they switched tabs or minimized the browser, their unsaved resume summary would randomly disappear! I traced the issue to Supabase automatically refreshing the secure auth token in the background when the window regained focus. This token refresh was accidentally triggering my initial `useEffect` 'Load Data' function, which was reaching into the database and overwriting the local React state with the old, empty data. I fixed it by using a `useRef` to track the initial load and adjusting my dependency arrays to ensure the database was only queried exactly once when the component first mounted."

**Answer (Option B - The Mobile Routing Bug):**
"I encountered a user experience issue on mobile: when users clicked on a specific Skill from the bottom of the Skills page, the new page would load, but the browser would stay scrolled down at the bottom! I realized that React Router doesn't automatically reset the window scroll position because it doesn't trigger a full page refresh. I solved this by creating a global `<ScrollToTop />` component containing a `useEffect` that listens to the `pathname` from `useLocation()`. Whenever the URL changes, it executes `window.scrollTo(0, 0)`, creating a seamless, app-like navigation experience."

---

### 8. How is the database structured?
**Answer:**
"It's a relational database in PostgreSQL. I have a core `users` table for profiles. Then I have tables like `saved_careers` and `saved_code` which have foreign keys pointing to the `users` table. I used Supabase's Row Level Security (RLS) policies to ensure that a user can only `SELECT`, `INSERT`, or `UPDATE` rows where the `user_id` matches their own authentication token."

---

### 9. How did you implement Gamification, XP, and Profile Levels?
**Answer:**
"I created a `user_gamification` table that tracks each user's `total_xp`, `current_streak`, `longest_streak`, and `last_active_date`.
In the React frontend, I mapped the `total_xp` to RPG-style ranks:
- **0–149 XP:** Python Beginner
- **150–399 XP:** Python Explorer
- **400–799 XP:** Python Professional
- **800+ XP:** Python Master
I display a Level Progress Bar on the Dashboard by calculating the percentage of XP achieved towards the next rank threshold, encouraging users to build their skills and keep learning."

---

### 10. How does the Daily Coding Challenge system work?
**Answer:**
"I designed a daily habit-building loop inspired by Duolingo.
1. **Challenge Database:** We have a `daily_challenges` table seeded with 30 unique, hand-crafted coding exercises ranging in difficulty from Easy (like 'Reverse a String') to Hard (like 'Max Subarray').
2. **Dynamic Daily Selection:** Instead of querying a random challenge, the application retrieves the challenge matching the current calendar day number (`Date.getDate()`), ensuring all global users receive the same challenge for that day.
3. **Execution & Validation:** The code editor uses Monaco Editor for the workspace. When users run the code, it compiles inside their browser using Pyodide, and the frontend automatically checks the program's output.
4. **Reward Locking:** Upon success, a Supabase query increases the user's XP by 50 and updates their `last_daily_completed` timestamp. The frontend checks this timestamp on page load to prevent users from spamming the challenge to exploit XP."

---

### 11. How did you implement the Global Leaderboard?
**Answer:**
"I built a dedicated `/leaderboard` page that queries the `user_gamification` table. I used PostgreSQL relational joins to grab the user's `full_name` from the `users` table in a single request:
`supabase.from('user_gamification').select('*, users(full_name)').order('total_xp', { ascending: false }).limit(50)`
I rank the users on a visual podium with custom gold, silver, and bronze styling for the top three, showcasing their name, level, XP, and current streak to create friendly competition."

---

### 12. How did you handle Search Engine Optimization (SEO) and sitemaps?
**Answer:**
"I integrated `react-helmet-async` on the frontend to inject page-specific metadata dynamically (title tags, unique descriptions, and viewport properties).
Additionally, I wrote a Node.js script called `generate_sitemap.js` that runs automatically as part of the Vercel build pipeline (`npm run build`). This script queries all of my career routes dynamically from the database and exports an XML sitemap (`sitemap.xml`) to the public folder, ensuring Google's web crawlers can easily index all of our unique roadmaps and courses."
