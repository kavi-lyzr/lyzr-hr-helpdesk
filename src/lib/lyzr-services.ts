import { defaultAgent } from './agent';
import { tools } from './tools';

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
    llm_credential_id: 'lyzr_google',
    embedding_credential_id: 'lyzr_openai',
    vector_db_credential_id: 'lyzr_qdrant',
    description: `HR Helpdesk Knowledge Base for ${organizationName}`,
    collection_name: collectionName,
    llm_model: 'gemini/gemini-2.0-flash-exp',
    embedding_model: 'text-embedding-3-small',
    vector_store_provider: 'qdrant',
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

/**
 * Create Lyzr Tools using OpenAPI specification
 */
export async function createLyzrTool(
  apiKey: string,
  organizationName: string
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

  const requestData = {
    tool_set_name: `hr_helpdesk_${organizationName.toLowerCase().replace(/\s+/g, '_')}`,
    openapi_schema: updatedTools,
    default_headers: {},
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
 * Create a Lyzr Agent with the specified configuration
 */
export async function createLyzrAgent(
  apiKey: string,
  organizationName: string,
  knowledgeBaseId: string,
  toolIds: string[],
  systemInstruction?: string
): Promise<LyzrAgentResponse> {
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
 * Chat with a Lyzr Agent
 */
export async function chatWithLyzrAgent(
  apiKey: string,
  agentId: string,
  message: string,
  systemPromptVariables: Record<string, any> = {},
  userId?: string,
  sessionId?: string
): Promise<{ response: string; session_id: string }> {
  const response = await fetch(`${LYZR_AGENT_BASE_URL}/v3/inference/chat/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      agent_id: agentId,
      message,
      user_id: userId || 'anonymous',
      session_id: sessionId,
      system_prompt_variables: systemPromptVariables,
      filter_variables: {},
      features: [],
      assets: []
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Chat failed:', response.status, errorText);
    throw new Error(`Failed to chat with agent: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  console.log('Chat response:', data);
  
  return {
    response: data.agent_response,
    session_id: data.session_id,
  };
}
