export const tools = {
    "openapi": "3.0.0",
    "info": {
      "title": "Helpdesk Ticket Management API",
      "version": "1.0.0",
      "description": "A unified API for managing support tickets. It allows creating, editing, and retrieving tickets for the HR Helpdesk system."
    },
    "servers": [
      {
        "url": "https://hr-helpdesk-ai.vercel.app/",
        "description": "Production Server"
      }
    ],
    "paths": {
      "/api/tools/raise_ticket": {
        "post": {
          "summary": "Create or raise a new support ticket",
          "description": "Use this tool to create a new support ticket when a user reports an issue. You must provide a description, category, priority, and department for the ticket.",
          "operationId": "raiseTicket",
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "description",
                    "category",
                    "priority",
                    "department"
                  ],
                  "properties": {
                    "description": {
                      "type": "string",
                      "description": "A detailed description of the user's issue or request."
                    },
                    "category": {
                      "type": "string",
                      "description": "The category of the ticket. Examples: 'IT', 'HR', 'Finance'."
                    },
                    "priority": {
                      "type": "string",
                      "description": "The priority level of the ticket. Examples: 'low', 'medium', 'high'."
                    },
                    "department": {
                      "type": "string",
                      "description": "The department the ticket is for. IMPORTANT: Only use department names that are provided in the system context. Do NOT use generic department names."
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Ticket created successfully."
            },
            "400": {
              "description": "Bad request due to missing required fields."
            }
          }
        }
      },
      "/api/tools/edit_ticket": {
        "post": {
          "summary": "Update an existing support ticket",
          "description": "Use this tool to modify or update an existing ticket's details. You must provide the ticket_id. All other fields like description, category, priority, department, or status are optional and will only be updated if provided.",
          "operationId": "editTicket",
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "ticket_id"
                  ],
                  "properties": {
                    "ticket_id": {
                      "type": "string",
                      "description": "The unique ID of the ticket to be updated."
                    },
                    "description": {
                      "type": "string",
                      "description": "The new, updated description for the ticket."
                    },
                    "category": {
                      "type": "string",
                      "description": "The new category for the ticket."
                    },
                    "priority": {
                      "type": "string",
                      "description": "The new priority level for the ticket."
                    },
                    "department": {
                      "type": "string",
                      "description": "The new department for the ticket. IMPORTANT: Only use department names that are provided in the system context."
                    },
                    "status": {
                      "type": "string",
                      "description": "The new status for the ticket. Examples: 'open', 'in_progress', 'closed'."
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Ticket updated successfully."
            },
            "400": {
              "description": "Bad request due to missing ticket_id."
            },
            "404": {
              "description": "Ticket not found with the provided ticket_id."
            }
          }
        }
      },
      "/api/tools/get_ticket": {
        "post": {
          "summary": "Get a list of all support tickets",
          "description": "Use this tool to fetch a list of all recently created support tickets. This tool does not require any parameters in the request body.",
          "operationId": "getTickets",
          "responses": {
            "200": {
              "description": "Successfully retrieved tickets."
            },
            "500": {
              "description": "Failed to fetch tickets."
            }
          }
        }
      }
    }
  }
  