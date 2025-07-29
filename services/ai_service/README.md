# 🤖 RAG with LangChain

This project follows the official LangChain tutorial:  
👉 [Build a Retrieval Augmented Generation (RAG) App](https://python.langchain.com/docs/tutorials/rag/)

The goal is to build a system that combines **information retrieval** with **language generation**, ideal for use cases such as **customer support**.

![image](https://github.com/user-attachments/assets/0902cf6c-0d9f-476c-a514-c3304a77f024)

![image](https://github.com/user-attachments/assets/b8c9f88a-9463-40b5-b023-c5cafb838bd9)

---

## 🔍 Key Concepts

### 📥 Indexing
The process of preparing data to be used for answering user questions.

- **Load**: Data is loaded using *Document Loaders*.
- **Split**: Large documents are split into smaller chunks using *Text Splitters*. This improves searchability and ensures they fit within the model's context window.
- **Store**: These chunks are stored in a *Vector Store* using embeddings, enabling similarity-based retrieval later.

### 💬 Retrieval + Generation
This is the online process that happens when the user interacts with the system.

- **Retrieve**: Relevant chunks are retrieved from the vector store based on the user query.
- **Generate**: A Language Model (LLM) generates an answer using the question and the retrieved context.

---

## ⚙️ Technologies Used

- **Python**
- **LangChain** and **LangGraph**
- **Vector Store** (e.g., FAISS or Chroma)
- **Jupyter Notebook**
- **ipykernel** (for virtual environment support in notebooks)

---

## 🧠 Possible Applications

- Customer support chatbots (SAC)
- Internal knowledge assistants
- Intelligent search over large document bases

---

## 📌 Status

This is a work-in-progress project used for learning and experimenting with the RAG architecture using LangChain.

---

## 📎 Original Tutorial

👉 https://python.langchain.com/docs/tutorials/rag/
