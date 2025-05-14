[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/mohit-novo-mcp-lithic-badge.png)](https://mseep.ai/app/mohit-novo-mcp-lithic)

# Lithic MCP Server (TypeScript)

A TypeScript implementation of a Model Context Protocol (MCP) server for Lithic API that provides read-only access to Lithic banking and card services.

## Features

- Modern TypeScript implementation using the MCP SDK
- Read-only access to all Lithic API endpoints
- Type-safe tools for accessing Lithic resources
- Docker support
- Improved error handling and validation

## Quick Start

### Using Docker (Recommended)

1. Build the Docker image:
```bash
npm run docker:build
```

2. Run the server:
```bash
LITHIC_API_KEY=your_key_here npm run docker:run
```

### Manual Setup

1. Install dependencies:
```bash
npm install
```

2. Build the TypeScript code:
```bash
npm run build
```

3. Start the server:
```bash
LITHIC_API_KEY=your_key_here npm start
```

## MCP Configuration

Add this to your `.cursor/mcp.json` or Claude Desktop configuration:

```json
{
  "lithic": {
    "command": "docker",
    "args": [
      "run",
      "--rm",
      "-i",
      "-e", "LITHIC_API_KEY",
      "-e", "LITHIC_API_BASE_URL",
      "mcp/lithic"
    ],
    "env": {
      "LITHIC_API_KEY": "your_lithic_api_key_here",
      "LITHIC_API_BASE_URL": "https://api.lithic.com/v1"
    }
  }
}
```

## Available Tools

This MCP server provides the following tools:

- `get_resource`: Fetch a specific Lithic resource by ID/token
- `list_resources`: List resources of a given type

## Environment Variables

- `LITHIC_API_KEY` - Your Lithic API key (required)
- `LITHIC_API_BASE_URL` - Lithic API base URL (default: https://sandbox.lithic.com/v1)

## Supported Resource Types

- card
- account
- financial_account
- transaction
- event
- balance
- dispute
- external_bank_account
- report
- webhook
- account_holder

## Development

For development, you can use the watch mode:

```bash
npm run dev
```

This will automatically rebuild and restart the server when you make changes to the source code. 