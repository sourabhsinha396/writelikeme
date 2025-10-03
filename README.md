# WriteLikeMe.io

An AI-powered writing style analyzer and content generator that learns your unique writing style and creates new content that matches it.

## Features

- **Writing Style Analysis**: Upload text samples (TXT, DOCX, PDF) or paste text to create unique writing profiles
- **AI Content Generation**: Generate new content on any topic in your analyzed writing style
- **Multiple Profiles**: Create and manage different writing profiles for various styles and purposes
- **User Authentication**: Support for traditional login/signup and Google OAuth
- **Anonymous Usage**: Try the service without creating an account
- **Payment Plans**: Tiered subscription plans with different word limits
- **Real-time Generation**: Stream generated content as it's being created
- **Document Processing**: Advanced PDF text extraction with OCR fallback for scanned documents

## Tech Stack

### Backend
- **FastAPI**: Modern Python web framework
- **PostgreSQL**: Database
- **SQLAlchemy**: ORM
- **Alembic**: Database migrations
- **Docker & Docker Compose**: Containerization
- **LiteLLM**: LLM integration abstraction
- **Langfuse**: LLM observability and monitoring
- **PayPal SDK**: Payment processing
- **Tesseract OCR**: Text extraction from images/scanned PDFs

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **shadcn/ui**: UI component library
- **Google Analytics**: Analytics

### AI & NLP
- **OpenAI API**: Content generation
- **NLTK**: Natural language processing
- **Custom Style Analyzer**: Proprietary writing style analysis

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for frontend development)
- Python 3.9+ (if running backend without Docker)
- Tesseract OCR installed on your system:
  - Ubuntu/Debian: `sudo apt-get install tesseract-ocr`
  - MacOS: `brew install tesseract`
  - Windows: [Download installer](https://github.com/UB-Mannheim/tesseract/wiki)

## Installation

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/writelikeme.git
   cd writelikeme
   ```

2. **Navigate to backend directory**
   ```bash
   cd backend-writelikeme
   ```

3. **Configure environment variables**
   ```bash
   cp .env.sample .env
   ```
   
   Edit `.env` and configure the variables

4. **Start the backend with Docker**
   ```bash
   docker compose up --build
   ```

5. **Run database migrations**
   ```bash
   docker compose exec web alembic upgrade head
   ```

6. **Access the API documentation** (optional)
   - Uncomment `docs_url="/docs"` in `main.py`
   - Visit: http://127.0.0.1:8000/docs

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend-writelikeme
   ```

2. **Configure environment variables**
   ```bash
   cp .env.sample .env
   ```
   
   Edit `.env` if needed

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Open http://localhost:3000 in your browser

## Usage
- Best try it at writelikeme.io



### Admin Panel

Access the admin panel at: http://127.0.0.1:8000/admin
Configure admin credentials in your environment variables.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- FastAPI and Next.js communities
- All contributors and users of WriteLikeMe.io

## Support

For issues, questions, or contributions, please:
- Open an issue on GitHub
- Visit [writelikeme.io](https://writelikeme.io)
- Contact me via chatbot or mail. I am available at chatbot most of the time.


---

Made with 🧠 + some Vibecoding by Sourabh