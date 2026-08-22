# DocsMind AI 🧠

DocsMind is a modern, production-ready Retrieval-Augmented Generation (RAG) document intelligence platform. It allows users to upload documents, process them into high-dimensional vector embeddings, and interactively chat with their data using Google's Gemini 2.5 Flash.

The application features a clean, responsive 3/4-column SaaS UI built with React and Tailwind CSS v4, complete with dynamic storage tracking, real-time context-aware chats, and exact text-source highlighting.

## 🌟 Features

- **Knowledge Vault:** Drag-and-drop upload for PDF, DOCX, and TXT files.
- **RAG Chat Canvas:** Ask questions about your documents and get accurate, AI-generated answers based *strictly* on your uploaded context.
- **Exact Source Preview:** Click on citation badges in the chat to slide out a panel showing the exact extracted text paragraph the AI used to answer your question.
- **Dynamic Insights & Storage:** Real-time tracking of MongoDB document sizes, total queries, and storage limits.
- **Markdown Support:** Beautifully formatted AI responses (bolding, lists, code) using `react-markdown` and Tailwind Typography.

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS v4 + `@tailwindcss/typography`
- **Icons:** `lucide-react`
- **HTTP Client:** `axios`
- **Markdown:** `react-markdown`

### Backend
- **Framework:** Node.js + Express
- **Database / Vector Store:** MongoDB Atlas + Vector Search
- **AI / LLM:** Google Gemini 2.5 Flash (`@langchain/google-genai`)
- **Embeddings:** Gemini Embedding 2 (3072 dimensions)
- **RAG Orchestration:** LangChain (`@langchain/mongodb`, `@langchain/core`)
- **Document Parsing:** `multer`, `pdf-parse`, `mammoth` (for DOCX)

---

## 🚀 Getting Started

### Prerequisites
1. **Node.js** (v18+)
2. **MongoDB Atlas Account:** You need an Atlas cluster with a **Vector Search Index** created.
3. **Google Gemini API Key:** Required for embeddings and LLM responses.

### 1. Environment Setup

Create a `.env` file in the `backend/` directory:
```env
PORT=3000
MONGODB_URI=your_mongodb_atlas_connection_string
MONGODB_DB=docsmind_db
MONGODB_COLLECTION=documents
GOOGLE_API_KEY=your_gemini_api_key
```

### 2. MongoDB Vector Search Configuration
Ensure you have created a Vector Search Index in your MongoDB Atlas collection named `vector_index`. The configuration must match the 3072 dimensions output by `gemini-embedding-2`:

```json
{
  "fields": [
    {
      "numDimensions": 3072,
      "path": "embedding",
      "similarity": "cosine",
      "type": "vector"
    }
  ]
}
```

### 3. Start the Backend

```bash
# From the project root
npm install
npm run dev
```
*The backend will run on `http://localhost:3000`*

### 4. Start the Frontend

```bash
# Open a new terminal
cd frontend
npm install
npm run dev
```
*The frontend will run on `http://localhost:5173`*

---

## 📁 Project Structure

```text
DocsMind/
├── backend/
│   ├── src/
│   │   ├── config/       # MongoDB & Env Config
│   │   ├── controllers/  # Route Logic (Query, Docs, Insights)
│   │   ├── middleware/   # Multer & Error Handling
│   │   ├── model/        # DB Schema & LangChain Vector Store
│   │   ├── routes/       # Express Routes
│   │   ├── services/     # Gemini LLM & Embeddings & Parsers
│   │   └── index.js      # Server Entry Point
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/   # ChatArea, KnowledgeVault, SourcePreview...
│   │   ├── App.jsx       # Main Layout & State
│   │   └── index.css     # Tailwind v4 setup
│   └── vite.config.js
└── README.md
```

## 🤝 Usage
1. Open `http://localhost:5173` in your browser.
2. Drag and drop a document into the Knowledge Vault zone.
3. Wait for the green "Indexed" status.
4. Type a question in the Chat Canvas!
