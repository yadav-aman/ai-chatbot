<h1 align="center">Next.js AI Knowledge-base chatbot</h1>

<p align="center">
  An fully local Open-Source AI knowledge made with Next.js and the AI SDK.
  Powered by Ollama and Postgres.
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#model-providers"><strong>Model Providers</strong></a> ·
  <a href="#deploy-your-own"><strong>Deploy Your Own</strong></a> ·
  <a href="#running-locally"><strong>Running locally</strong></a>
</p>
<br/>

## Features

- [Next.js](https://nextjs.org) App Router
  - Advanced routing for seamless navigation and performance
  - React Server Components (RSCs) and Server Actions for server-side rendering and increased performance
- [AI SDK](https://sdk.vercel.ai/docs)
  - Unified API for generating text, structured objects, and tool calls with LLMs
  - Hooks for building dynamic chat and generative user interfaces
- [shadcn/ui](https://ui.shadcn.com)
  - Styling with [Tailwind CSS](https://tailwindcss.com)
  - Component primitives from [Radix UI](https://radix-ui.com) for accessibility and flexibility
- Data Persistence
  - [Postgres](https://github.com/timescale/pgai/blob/main/docs/vectorizer-quick-start.md) for saving chat history and user data
  - [Min.io](https://min.io/docs/minio/container/index.html) for efficient file storage
- [NextAuth.js](https://github.com/nextauthjs/next-auth)
  - Simple and secure authentication
- [Ollama](https://ollama.com/) for AI model management
  - Easily switch between different AI models and providers
- [pgvector](https://github.com/pgvector/pgvector) for vector similarity search
  - Efficiently store embeddings for similarity search
- [pgvectorscale](https://github.com/timescale/pgvectorscale) for scaling vector similarity search
  - Query embeddings for RAG

## Model Providers

- [Llama3.1 8B](https://ollama.com/library/llama3.1) (Meta) powers the chatbot 
- [mxbai-embed-large](https://ollama.com/library/mxbai-embed-large) (mixedbread.ai) for embeddings

## Running locally

You will need to use the environment variables [defined in `.env.example`](.env.example) to run Next.js AI Chatbot.

Create a `.env.local` file in the root of the project and add the environment variables as defined in `.env.example`.

> Note: You should not commit your `.env.local` file or it will expose secrets that will allow others to control access to your various OpenAI and authentication provider accounts.

1. Download Ollama form the [Ollama website](https://ollama.com/download) and install it.
2. Pull `llama3.1` and `mxbai-embed-large` models from the Ollama library.
3. Create `.env.local` file in the root of the project.

> Note: For postgres and minio, you can use docker-compose to run them locally.<br>
> Minio will be running on [localhost:9000](http://localhost:9000/). and Postgres will be running on [localhost:5434](http://localhost:5432/).<br>
> You can use [localhost:9001](http://localhost:9001/) to access the Minio web interface.

4. Login to minio web interface and create a access key and secret key
5. Attach read and write policy to the access key and save it
```json
{
 "Version": "2012-10-17",
 "Statement": [
  {
   "Effect": "Allow",
   "Action": [
    "s3:*"
   ],
   "Resource": [
    "arn:aws:s3:::*"
   ]
  }
 ]
}
```
6. Run the following commands:

```bash
pnpm install
pnpm migrate:db
pnpm dev
```

Your app should now be running on [localhost:3000](http://localhost:3000/).
