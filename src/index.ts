#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { 
  CallToolRequestSchema, 
  ListToolsRequestSchema,
  InitializeRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import axios, { AxiosInstance } from "axios";

// Protocol version for MCP
const PROTOCOL_VERSION = "1.0.0";

// Create Lithic API client
const createLithicApiClient = (): AxiosInstance => {
  return axios.create({
    baseURL: process.env.LITHIC_API_BASE_URL || 'https://sandbox.lithic.com/v1',
    headers: {
      'Authorization': process.env.LITHIC_API_KEY || '',
      'Content-Type': 'application/json'
    },
    timeout: 30000 // 30 second timeout
  });
};

// Resource type mapping
const RESOURCE_MAP: Record<string, string> = {
  'card': 'card',
  'account': 'account',
  'financial_account': 'financial_account',
  'financial-account': 'financial_account',
  'credit': 'financial_account',
  'credit-account': 'financial_account',
  'transaction': 'transaction',
  'event': 'event',
  'balance': 'balance',
  'dispute': 'dispute',
  'bank': 'external_bank_account',
  'bank-account': 'external_bank_account',
  'external_bank_account': 'external_bank_account',
  'report': 'report',
  'webhook': 'webhook',
  'card_program': 'card_program',
  'account_holder': 'account_holder'
};

// Create the MCP server
const server = new Server({
  name: "lithic-mcp",
  version: PROTOCOL_VERSION
}, {
  capabilities: {
    tools: {}
  }
});

// Define resource schemas
const resourceIdSchema = z.string().describe("Resource ID or token");
const resourceTypeSchema = z.string().describe("Type of resource to fetch");

// Handle initialization requests
server.setRequestHandler(InitializeRequestSchema, async (request) => {
  console.error('Received initialize request with protocol version:', request.params.protocolVersion);
  return {
    serverInfo: {
      name: "lithic-mcp",
      version: PROTOCOL_VERSION
    },
    protocolVersion: request.params.protocolVersion,
    capabilities: {
      tools: {}
    }
  };
});

// Register available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_resource",
        description: "Get a specific Lithic resource by ID",
        inputSchema: {
          type: "object",
          properties: {
            resourceType: {
              type: "string",
              description: "Type of resource (card, account, transaction, etc.)"
            },
            resourceId: {
              type: "string",
              description: "ID/token of the resource to fetch"
            }
          },
          required: ["resourceType", "resourceId"]
        }
      },
      {
        name: "list_resources",
        description: "List resources of a specific type",
        inputSchema: {
          type: "object",
          properties: {
            resourceType: {
              type: "string",
              description: "Type of resource to list (cards, accounts, transactions, etc.)"
            }
          },
          required: ["resourceType"]
        }
      }
    ]
  };
});

// Map resource type to API endpoint
function mapResourceTypeToEndpoint(resourceType: string): string {
  switch (resourceType) {
    case 'card':
      return '/cards';
    case 'account':
      return '/accounts';
    case 'financial_account':
      return '/financial_accounts';
    case 'transaction':
      return '/transactions';
    case 'external_bank_account':
      return '/external_bank_accounts';
    case 'event':
      return '/events';
    case 'balance':
      return '/balances';
    case 'card_program':
      return '/card_programs';
    case 'dispute':
      return '/disputes';
    case 'report':
      return '/reports';
    case 'webhook':
      return '/webhooks';
    case 'account_holder':
      return '/account_holders';
    default:
      return `/${resourceType}s`; // Default to pluralizing the resource type
  }
}

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  // Create Lithic API client for each request
  const lithicApi = createLithicApiClient();
  
  if (request.params.name === "get_resource") {
    try {
      // Parse and validate arguments
      const args = z.object({
        resourceType: resourceTypeSchema,
        resourceId: resourceIdSchema
      }).parse(request.params.arguments);

      // Map to standardized resource type
      const standardizedResourceType = RESOURCE_MAP[args.resourceType.toLowerCase()] || args.resourceType;
      
      // Map resource type to endpoint
      const endpoint = mapResourceTypeToEndpoint(standardizedResourceType);
      const response = await lithicApi.get(`${endpoint}/${args.resourceId}`);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response.data, null, 2)
          }
        ]
      };
    } catch (error: any) {
      console.error(`Error fetching resource:`, error.message);

      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error fetching resource: ${error.message}`
          }
        ]
      };
    }
  } else if (request.params.name === "list_resources") {
    try {
      // Parse and validate arguments
      const args = z.object({
        resourceType: resourceTypeSchema
      }).parse(request.params.arguments);

      // Map to standardized resource type
      const standardizedResourceType = RESOURCE_MAP[args.resourceType.toLowerCase()] || args.resourceType;
      
      // Map resource type to endpoint
      const endpoint = mapResourceTypeToEndpoint(standardizedResourceType);
      const response = await lithicApi.get(endpoint);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response.data, null, 2)
          }
        ]
      };
    } catch (error: any) {
      console.error(`Error listing resources:`, error.message);

      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error listing resources: ${error.message}`
          }
        ]
      };
    }
  }

  // Handle unknown tool
  return {
    isError: true,
    content: [
      {
        type: "text",
        text: `Unknown tool: ${request.params.name}`
      }
    ]
  };
});

// Start the server with stdio transport
async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Lithic MCP server running on stdio");
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Keep the process alive and handle signals properly
process.on('SIGINT', () => {
  process.exit(0);
});

process.on('SIGTERM', () => {
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err.message);
});

// Start the server
main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
}); 