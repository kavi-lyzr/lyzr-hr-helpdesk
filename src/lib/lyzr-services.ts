import { defaultAgent } from './agent';
import { tools } from './tools';
import { encrypt } from './encryption';
import { getAgentConfig, LATEST_TOOL_VERSION } from './agent-config';

const LYZR_BASE_URL = 'https://app.lyzr.ai';
const LYZR_RAG_BASE_URL = 'https://rag-prod.studio.lyzr.ai';
const LYZR_AGENT_BASE_URL = 'https://agent-prod.studio.lyzr.ai';

export interface LyzrAgentResponse {
  agent_id: string;
  name: string;
  description: string;
}

export interface LyzrKnowledgeBaseResponse {
  rag_id: string;
  rag_name: string;
  base_url: string;
}

export interface LyzrToolResponse {
  tool_ids: string[]; // Toolset returns multiple tool IDs
  tool_name: string;
  openapi_spec: object;
}

/**
 * Create a Lyzr Knowledge Base (RAG) for the organization
 */
export async function createLyzrKnowledgeBase(
  apiKey: string,
  organizationName: string,
): Promise<LyzrKnowledgeBaseResponse> {
  const collectionName = `hr_helpdesk_${organizationName.toLowerCase().replace(/\s+/g, '_')}`;
  
  const requestData = {
    user_id: apiKey,
    llm_credential_id: 'lyzr_openai', //'lyzr_google',
    embedding_credential_id: 'lyzr_openai', //'lyzr_openai',
    vector_db_credential_id: 'lyzr_qdrant',
    description: `HR Helpdesk Knowledge Base for ${organizationName}`,
    collection_name: collectionName,
    llm_model: 'gpt-4o-mini', //'gemini/gemini-2.0-flash-exp',
    embedding_model: 'text-embedding-ada-002', //'text-embedding-3-small',
    vector_store_provider: 'Qdrant [Lyzr]', //'qdrant',
    semantic_data_model: false,
    meta_data: {}
  };

  console.log('Creating Knowledge Base with request:', requestData);

  const response = await fetch(`${LYZR_RAG_BASE_URL}/v3/rag/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify(requestData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('RAG creation failed:', response.status, errorText);
    throw new Error(`Failed to create knowledge base: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  console.log('RAG creation response:', data);
  
  return {
    rag_id: data.id, // API returns 'id' not 'rag_id'
    rag_name: data.collection_name,
    base_url: LYZR_RAG_BASE_URL
  };
}

export interface ToolContext {
  userId: string;
  userEmail: string;
  organizationId: string;
  organizationName: string;
}

/**
 * Create Lyzr Tools using OpenAPI specification
 */
export async function createLyzrTool(
  apiKey: string,
  organizationName: string,
  context: ToolContext
): Promise<LyzrToolResponse> {
  // Get the base URL from environment or use default
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000';
  
  // Update the tools schema with the correct server URL
  const updatedTools = {
    ...tools,
    info: {
      ...tools.info,
      title: `HR Helpdesk Tools - ${organizationName}`,
    },
    servers: [
      {
        url: baseUrl,
        description: "HR Helpdesk API Server"
      }
    ]
  };

  // Create encrypted context token for tool authorization
  const contextToken = encrypt(JSON.stringify(context));

  const requestData = {
    tool_set_name: `hr_helpdesk_${organizationName.toLowerCase().replace(/\s+/g, '_')}`,
    openapi_schema: updatedTools,
    default_headers: {
      "x-token": contextToken
    },
    default_query_params: {},
    default_body_params: {},
    endpoint_defaults: {},
    enhance_descriptions: false,
    openai_api_key: null
  };

  console.log('Creating Tool with request:', JSON.stringify(requestData, null, 2));

  const response = await fetch(`${LYZR_AGENT_BASE_URL}/v3/tools/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify(requestData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Tool creation failed:', response.status, errorText);
    throw new Error(`Failed to create tool: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  console.log('Tool creation response:', data);
  
  // Extract just the tool names from the tool objects
  const toolNames = data.tool_ids ? data.tool_ids.map((tool: any) => tool.name) : [];
  console.log('Extracted tool names:', toolNames);
  
  return {
    tool_ids: toolNames, // Array of tool names (strings)
    tool_name: `hr_helpdesk_${organizationName.toLowerCase().replace(/\s+/g, '_')}`,
    openapi_spec: updatedTools,
  };
}

/**
 * Create a new versioned toolset for an organization.
 * Creates a fresh toolset with version suffix in the name,
 * so it doesn't conflict with existing tools.
 * Returns the new tool IDs to be stored on the org and bound to the agent.
 */
export async function createVersionedTools(
  apiKey: string,
  organizationName: string,
  context: ToolContext,
  version: string = LATEST_TOOL_VERSION,
): Promise<LyzrToolResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000';
  const orgSlug = organizationName.toLowerCase().replace(/\s+/g, '_');
  const versionSlug = version.replace(/\./g, '_');

  const updatedTools = {
    ...tools,
    info: {
      ...tools.info,
      title: `HR Helpdesk Tools - ${organizationName} v${version}`,
      version: version,
    },
    servers: [
      {
        url: baseUrl,
        description: 'HR Helpdesk API Server',
      },
    ],
  };

  const contextToken = encrypt(JSON.stringify(context));

  const requestData = {
    tool_set_name: `hr_helpdesk_${orgSlug}_v${versionSlug}`,
    openapi_schema: updatedTools,
    default_headers: {
      'x-token': contextToken,
    },
    default_query_params: {},
    default_body_params: {},
    endpoint_defaults: {},
    enhance_descriptions: false,
    openai_api_key: null,
  };

  console.log(`Creating versioned tools v${version} for org "${organizationName}"`);

  const response = await fetch(`${LYZR_AGENT_BASE_URL}/v3/tools/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify(requestData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Versioned tool creation failed:', response.status, errorText);
    throw new Error(`Failed to create versioned tools: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const toolNames = data.tool_ids ? data.tool_ids.map((tool: any) => tool.name) : [];
  console.log(`Created versioned tools v${version}:`, toolNames);

  return {
    tool_ids: toolNames,
    tool_name: `hr_helpdesk_${orgSlug}_v${versionSlug}`,
    openapi_spec: updatedTools,
  };
}

/**
 * Create a Lyzr Agent with the specified configuration
 */
export async function createLyzrAgent(
  apiKey: string,
  organizationName: string,
  knowledgeBaseId: string,
  toolIds: string[],
  systemInstruction?: string
): Promise<LyzrAgentResponse> {
  // Prepare tool configs based on tool IDs and descriptions (tool_configs alone populate tool usage)
  const toolConfigs = toolIds.map((toolId, index) => {
    const descriptions = [
      "call this raise ticket tool when you don't have context to answer user's query",
      "when a user wants to edit one of the tickets they raised, call this tool. requires ticket_id so always call get ticket first unless you already have the ticket_id in context",
      "use this tool to get all the tickets in the system"
    ];
    
    return {
      tool_name: toolId,
      tool_source: "openapi",
      action_names: [descriptions[index] || descriptions[0]],
      persist_auth: false
    };
  });

  // Prepare the agent configuration based on defaultAgent
  // Keep the placeholders as they will be replaced at runtime via system_prompt_variables
  const agentConfig = {
    ...defaultAgent,
    name: `HR Helpdesk AI - ${organizationName}`,
    description: `A friendly and efficient AI-powered HR Assistant for ${organizationName}. It answers HR-related questions using a dedicated knowledge base and can manage support tickets`,
    // Keep the original agent_instructions with placeholders intact
    agent_instructions: defaultAgent.agent_instructions,
    features: [
      {
        type: "MEMORY",
        config: {
          max_messages_context_count: 10
        },
        priority: 0
      },
      {
        type: "KNOWLEDGE_BASE",
        config: {
          lyzr_rag: {
            base_url: "https://rag-prod.studio.lyzr.ai",
            rag_id: knowledgeBaseId,
            rag_name: `hr_helpdesk_${organizationName.toLowerCase().replace(/\s+/g, '_')}`,
            params: {
              top_k: 5,
              retrieval_type: "basic",
              score_threshold: 0.5
            }
          },
          agentic_rag: []
        },
        priority: 0
      }
    ],
    tools: toolIds, // Array of tool names (strings)
    tool_configs: toolConfigs, // Array of tool configurations
  };

  console.log('Tool IDs being passed to agent:', toolIds);
  console.log('Creating Agent with config:', JSON.stringify(agentConfig, null, 2));

  const response = await fetch(`${LYZR_AGENT_BASE_URL}/v3/agents/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify(agentConfig),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Agent creation failed:', response.status, errorText);
    throw new Error(`Failed to create agent: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  console.log('Agent creation response:', data);
  
  return {
    agent_id: data.agent_id,
    name: data.name,
    description: data.description,
  };
}

/**
 * Chat with a Lyzr Agent (streaming)
 * Returns a ReadableStream for streaming responses token-by-token
 */
export async function streamChatWithAgent(
  apiKey: string,
  agentId: string,
  message: string,
  userEmail: string,
  sessionId: string,
  systemPromptVariables: Record<string, any> = {},
): Promise<ReadableStream> {
  const requestBody = {
    user_id: userEmail,
    agent_id: agentId,
    session_id: sessionId,
    message: message,
    system_prompt_variables: systemPromptVariables,
    filter_variables: {},
    features: [],
    assets: [],
  };

  console.log('Streaming chat request:', JSON.stringify(requestBody, null, 2));

  const response = await fetch(`${LYZR_AGENT_BASE_URL}/v3/inference/stream/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Streaming chat failed:', response.status, errorText);
    throw new Error(`Failed to stream chat with agent: ${response.status} ${errorText}`);
  }

  if (!response.body) {
    throw new Error('Response body is null');
  }

  return response.body;
}

/**
 * Chat with a Lyzr Agent (non-streaming, kept as fallback)
 */
export async function chatWithLyzrAgent(
  apiKey: string,
  agentId: string,
  message: string,
  userEmail: string,
  systemPromptVariables: Record<string, any> = {},
  sessionId?: string
): Promise<{ response: string; session_id: string }> {
  // Generate session ID if not provided
  const finalSessionId = sessionId || `${agentId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const requestBody = {
    user_id: userEmail,
    agent_id: agentId,
    session_id: finalSessionId,
    message: message,
    system_prompt_variables: systemPromptVariables,
    filter_variables: {},
    features: [],
    assets: []
  };

  console.log('Chat request:', JSON.stringify(requestBody, null, 2));

  const response = await fetch(`${LYZR_AGENT_BASE_URL}/v3/inference/chat/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Chat failed:', response.status, errorText);
    throw new Error(`Failed to chat with agent: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  console.log('Chat response:', data);
  
  return {
    // response: data.agent_response,
    response: data.response,
    session_id: data.session_id || finalSessionId,
  };
}

/**
 * Update an existing Lyzr Agent with the latest config.
 * Uses PUT on the single-task template endpoint.
 * Preserves org-specific KB/tools — only updates agent instructions, model, etc.
 */
export async function updateLyzrAgent(
  apiKey: string,
  agentId: string,
  organizationName: string,
  knowledgeBaseId: string,
  toolIds: string[],
): Promise<void> {
  const agentConfig = getAgentConfig();

  // Build tool configs (same logic as createLyzrAgent)
  const toolConfigs = toolIds.map((toolId, index) => {
    const descriptions = [
      "call this raise ticket tool when you don't have context to answer user's query",
      "when a user wants to edit one of the tickets they raised, call this tool. requires ticket_id so always call get ticket first unless you already have the ticket_id in context",
      "use this tool to get all the tickets in the system",
    ];
    return {
      tool_name: toolId,
      tool_source: 'openapi',
      action_names: [descriptions[index] || descriptions[0]],
      persist_auth: false,
    };
  });

  const payload = {
    ...agentConfig,
    name: `HR Helpdesk AI - ${organizationName}`,
    description: `A friendly and efficient AI-powered HR Assistant for ${organizationName}. It answers HR-related questions using a dedicated knowledge base and can manage support tickets`,
    features: [
      {
        type: 'MEMORY',
        config: { max_messages_context_count: 10 },
        priority: 0,
      },
      {
        type: 'KNOWLEDGE_BASE',
        config: {
          lyzr_rag: {
            base_url: 'https://rag-prod.studio.lyzr.ai',
            rag_id: knowledgeBaseId,
            rag_name: `hr_helpdesk_${organizationName.toLowerCase().replace(/\s+/g, '_')}`,
            params: {
              top_k: 5,
              retrieval_type: 'basic',
              score_threshold: 0.5,
            },
          },
          agentic_rag: [],
        },
        priority: 0,
      },
    ],
    tools: toolIds,
    tool_configs: toolConfigs,
    store_messages: true,
  };

  console.log(`Updating agent ${agentId} for org "${organizationName}"`);

  const response = await fetch(
    `${LYZR_AGENT_BASE_URL}/v3/agents/template/single-task/${agentId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 404) {
      const error: any = new Error('Agent not found in Lyzr Studio');
      error.code = 'AGENT_NOT_FOUND';
      throw error;
    }
    console.error('Agent update failed:', response.status, errorText);
    throw new Error(`Failed to update agent: ${response.status} ${errorText}`);
  }

  console.log(`Agent ${agentId} updated successfully`);
}
