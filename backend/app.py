from flask import Flask, request, jsonify
from azure.core.credentials import AzureKeyCredential
from azure.search.documents import SearchClient
from openai import AzureOpenAI
import os
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Load sensitive data from environment variables
search_key = os.getenv('SEARCH_KEY')
openai_api_key = os.getenv('OPENAI_API_KEY')

# Azure AI Search service endpoint and API key
search_endpoint = "https://hu-cares-ai-search.search.windows.net"
search_index_name = "cosmosdb-index-v5"

# OpenAI API endpoint and API key
openai_endpoint = "https://hu-cares.openai.azure.com/"
openai_api_version = "2024-02-15-preview"

# Create a SearchClient object for Azure Cognitive Search
search_credential = AzureKeyCredential(search_key)
search_client = SearchClient(endpoint=search_endpoint, index_name=search_index_name, credential=search_credential)

# Create an AzureOpenAI client for OpenAI API
openai_client = AzureOpenAI(
    azure_endpoint=openai_endpoint,
    api_key=openai_api_key,
    api_version=openai_api_version
)

@app.route('/')
def home():
    return "Welcome to the API!"

@app.route('/api', methods=['POST'])
def process_request():
    if not request.json or 'current_chat' not in request.json:
        return jsonify({"error": "Please provide 'current_chat' in JSON request"}), 400

    data = request.json
    current_chat = data.get('current_chat')
    history = data.get('history')

    # Perform search using Azure Cognitive Search
    search_results = perform_search(current_chat)

    # Prepare message text for OpenAI API
    message_text = [
        {"role": "system", "content": "You are an AI assistant for Howard University."},
        {"role": "system", "content": f"You have all this information: {search_results}"},
        {"role": "user", "content": f"{current_chat}. And give me the source URL."},
    ]

    # Generate completion from OpenAI API
    completion = openai_client.chat.completions.create(
        model="backend",  # Use your deployment name
        messages=message_text,
        temperature=0.7,
        max_tokens=800,
        top_p=0.95,
        frequency_penalty=0,
        presence_penalty=0,
        stop=None
    )

    message_content = completion.choices[0].message.content

    # Create JSON response
    response = {
        "current_chat": current_chat,
        "history": history,
        "search_results": search_results,
        "openai_response": message_content
    }

    return jsonify(response)

def perform_search(search_text):
    try:
        select = "url, content"
        top_results = 3

        search_results = search_client.search(search_text=search_text, select=select, top=top_results)
        json_results = [result for result in search_results]

        return json_results
    except Exception as e:
        print("An error occurred during search:", e)
        return []

if __name__ == '__main__':
    app.run(debug=True)
