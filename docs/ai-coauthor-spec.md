# AI Co-Author Tab Specification

## Version 1.0 - Draft Specification
**Status:** For Review
**Date:** October 2024

## 1. Overview

The AI Co-Author tab integrates Large Language Model (LLM) capabilities directly into BranchEd to assist with creating and editing Twee passages. This feature provides intelligent assistance while maintaining strict adherence to Twee 1.0 format and BranchEd's specific feature set.

## 2. Core Requirements

### 2.1 LLM Provider Configuration

The system must support multiple LLM providers with user-configurable endpoints:

#### Supported Providers
- **Anthropic Claude** (Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku)
  - Endpoint: `https://api.anthropic.com/v1/messages`
  - Model IDs: `claude-3-5-sonnet-20241022`, `claude-3-opus-20240229`, `claude-3-haiku-20240307`

- **OpenAI GPT** (GPT-4, GPT-3.5)
  - Endpoint: `https://api.openai.com/v1/chat/completions`
  - Model IDs: `gpt-4-turbo`, `gpt-3.5-turbo`

- **Local/Custom LLMs** (Ollama, LM Studio, etc.)
  - Custom endpoint configuration
  - Compatible with OpenAI API format

#### Provider Configuration UI
```
LLM Provider: [Dropdown: Anthropic | OpenAI | Custom]
Model: [Dropdown based on provider]
Custom Endpoint: [Text field - only shown for Custom]
Temperature: [Slider: 0.0 - 1.0, default 0.7]
Max Tokens: [Number field, default 2000]
```

### 2.2 API Key Management

#### Security Requirements
- **Never store API keys in:**
  - Local storage
  - Cookies
  - JavaScript variables
  - Configuration files
  - Git repository

- **Secure storage approach:**
  - Server-side environment variables only
  - Keys stored in `.env` file (git-ignored)
  - Keys never transmitted to client after initial setup
  - Session-based authentication tokens for client-server communication

#### Implementation Strategy
```python
# server.py additions
import os
from dotenv import load_dotenv

load_dotenv()  # Load from .env file

class APIKeyManager:
    @staticmethod
    def get_api_key(provider):
        key_map = {
            'anthropic': 'ANTHROPIC_API_KEY',
            'openai': 'OPENAI_API_KEY',
            'custom': 'CUSTOM_LLM_API_KEY'
        }
        return os.environ.get(key_map.get(provider))

    @staticmethod
    def validate_and_store_key(provider, key):
        # Validate key format
        # Test with actual API call
        # Store in .env file
        pass
```

#### Configuration Flow
1. User clicks "Configure API Keys" button
2. Modal shows current configuration status (configured/not configured)
3. User enters API key in secure input field
4. Server validates key with test API call
5. On success, key is written to `.env` file
6. UI shows "Configured ✓" without displaying key

### 2.3 System Prompts

#### Base System Prompt
```
You are an AI assistant integrated into BranchEd, a visual story editor for Twee 1.0 format interactive fiction. Your role is to help create and edit story passages while strictly adhering to Twee format constraints.

CRITICAL RULES:
1. You may ONLY generate valid Twee 1.0 content
2. You may ONLY work with passages, links, and supported macros
3. You must REJECT requests for non-Twee content (Python, SQL, JavaScript, etc.)
4. You must maintain consistency with existing story variables and passages

TWEE FORMAT:
- Passages contain narrative text and links
- Links: [[Display Text|Target Passage]] or [[Target Passage]]
- Variables: $VARIABLE_NAME (uppercase convention)
- Conditionals: <<if>>, <<elseif>>, <<else>>, <<endif>>
- Set variables: <<set $VAR = value>>
- Tags: $start, $metadata, $lane:LaneName

AVAILABLE CONTEXT:
- Current passage: {current_passage_title}
- Current content: {current_passage_content}
- Available variables: {story_variables}
- Existing passages: {passage_list}
- Current tags: {current_tags}
```

#### Content Generation Constraints
```
ALLOWED CONTENT:
✓ Narrative text and descriptions
✓ Character dialogue
✓ Twee links and passage connections
✓ Conditional logic using Twee macros
✓ Variable manipulation with <<set>>
✓ Story branching and choices

FORBIDDEN CONTENT:
✗ Programming code (Python, JavaScript, SQL, etc.)
✗ HTML beyond basic formatting
✗ External scripts or includes
✗ System commands or file operations
✗ Non-Twee macro syntax
✗ Direct API calls or network requests

When user requests forbidden content, respond:
"I can only help with Twee story content. For [requested topic], please use appropriate external tools."
```

#### Task-Specific Prompts

**Creating New Passages:**
```
Create a new passage following these guidelines:
- Title should be concise and descriptive
- Use PascalCase for passage titles
- Include appropriate lane tag if part of character/location arc
- Create natural link connections to existing passages
- Maintain narrative consistency with connected passages
```

**Editing Existing Passages:**
```
When editing passage "{title}":
- Preserve existing links unless explicitly asked to change
- Maintain variable continuity
- Keep consistent tone and style
- Respect established character voices
- Update links if passage titles change
```

**Generating Choices:**
```
Create meaningful story choices:
- Each choice should have consequences
- Vary choice types (moral, practical, emotional)
- Use variables to track important decisions
- Create both immediate and long-term impacts
- Balance choice difficulty
```

### 2.4 UI/UX Design

#### Layout Structure
```
┌─────────────────────────────────────┐
│ Co-Author Tab                       │
├─────────────────────────────────────┤
│ [⚙️ Settings] [📋 Templates] [🔄]   │
├─────────────────────────────────────┤
│ Context: Editing "PassageName"      │
├─────────────────────────────────────┤
│ ┌───────────────────────────────┐   │
│ │ Prompt/Request                │   │
│ │ [Multi-line text area]        │   │
│ └───────────────────────────────┘   │
│                                      │
│ [🤖 Generate] [📝 Insert] [🔄 Retry]│
├─────────────────────────────────────┤
│ AI Response:                        │
│ ┌───────────────────────────────┐   │
│ │ [Generated content with       │   │
│ │  syntax highlighting]         │   │
│ └───────────────────────────────┘   │
│                                      │
│ [✅ Accept] [✏️ Edit] [❌ Reject]   │
└─────────────────────────────────────┘
```

#### Interaction Flow
1. **Context Awareness**: Always shows current passage being edited
2. **Smart Suggestions**: Pre-filled prompt templates for common tasks
3. **Preview Mode**: Shows how generated content will look in passage
4. **Diff View**: Shows changes before applying them
5. **Undo/Redo**: Full history of AI-assisted changes

### 2.5 Prompt Templates

Quick-access templates for common tasks:

```javascript
const promptTemplates = {
  "Continue Story": "Continue this passage with 2-3 paragraphs that advance the narrative",
  "Add Choices": "Add 3 meaningful choices at the end of this passage",
  "Create Branch": "Create a branching storyline from this point with 2 different paths",
  "Add Dialogue": "Add character dialogue that reveals personality and advances plot",
  "Insert Description": "Add atmospheric description of the current location/scene",
  "Variable Check": "Add conditional content based on story variables",
  "Character Entry": "Create an entrance for a new or existing character",
  "Puzzle/Challenge": "Design a puzzle or challenge appropriate to the story context",
  "Emotional Beat": "Add an emotional moment or character reflection",
  "Foreshadowing": "Insert subtle foreshadowing for future events"
};
```

### 2.6 Safety and Validation

#### Input Validation
- Sanitize all user prompts before sending to LLM
- Validate generated content is valid Twee format
- Check for malicious content patterns
- Verify passage title uniqueness
- Validate variable naming conventions

#### Output Validation
```javascript
function validateTweeContent(content) {
  const validations = {
    // No script tags or JavaScript
    noScripts: !/<script|javascript:/i.test(content),

    // Valid link format
    validLinks: /\[\[([^\]]+)\]\]/g.test(content) || !content.includes('[['),

    // Valid macro format
    validMacros: /<<[^>]+>>/g.test(content) || !content.includes('<<'),

    // No system commands
    noSystemCommands: !/\b(exec|system|eval|import)\b/i.test(content),

    // Valid variable format
    validVariables: /\$[A-Z_][A-Z0-9_]*/g.test(content) || !content.includes('$')
  };

  return Object.values(validations).every(v => v);
}
```

### 2.7 Error Handling

#### API Errors
- Rate limiting: Queue requests and show wait time
- Network errors: Retry with exponential backoff
- Invalid API key: Prompt for reconfiguration
- Model errors: Fallback to simpler model if available

#### Content Errors
- Invalid Twee: Highlight problematic sections
- Broken links: Suggest existing passages or create new
- Undefined variables: Prompt to create or select existing
- Circular references: Detect and warn

### 2.8 Advanced Features

#### Context Window Management
- Track token usage per conversation
- Intelligently prune context when approaching limits
- Prioritize relevant passages and variables
- Maintain conversation coherence

#### Multi-Passage Operations
- Generate connected passage sequences
- Bulk edit multiple passages
- Create entire story branches
- Refactor passage names across story

#### Story Analysis
- Identify plot holes or inconsistencies
- Suggest missing connections
- Analyze choice balance
- Review variable usage

## 3. Implementation Phases

### Phase 1: Core Integration (MVP)
- Basic LLM configuration (Anthropic Claude only)
- Simple API key management
- Basic prompt/response interface
- Single passage editing
- Base system prompt

### Phase 2: Enhanced Safety
- Full content validation
- Sandbox enforcement
- Error handling and recovery
- Prompt templates
- Multiple provider support

### Phase 3: Advanced Features
- Context window management
- Multi-passage operations
- Story analysis tools
- Custom prompt library
- Collaborative features

## 4. Security Considerations

### API Key Security
- Use HTTPS only for API communications
- Implement request signing
- Add rate limiting per session
- Monitor for unusual usage patterns
- Regular key rotation reminders

### Content Security
- Prevent prompt injection attacks
- Sanitize all LLM outputs
- Validate against XSS patterns
- Prevent data exfiltration attempts
- Audit log all AI interactions

## 5. Performance Considerations

### Response Time Optimization
- Stream responses when possible
- Cache common requests
- Pre-fetch likely continuations
- Background processing for large operations

### Resource Management
- Limit concurrent API requests
- Implement request queuing
- Monitor memory usage
- Clean up old conversations

## 6. Testing Requirements

### Unit Tests
- Twee validation functions
- API key management
- Prompt construction
- Response parsing

### Integration Tests
- LLM provider connections
- Error handling paths
- Content validation pipeline
- UI interaction flows

### User Acceptance Tests
- Story creation workflows
- Editing existing content
- Error recovery scenarios
- Performance under load

## 7. Documentation Requirements

### User Documentation
- Getting started guide
- API key setup walkthrough
- Prompt writing best practices
- Troubleshooting guide

### Developer Documentation
- API integration details
- System prompt customization
- Extension points
- Security implementation

## 8. Future Enhancements

### Potential Features
- Fine-tuned models for Twee
- Voice input for prompts
- Collaborative AI sessions
- Story style learning
- Automated testing of story paths
- Translation support
- Accessibility narration

### Research Areas
- Better context compression
- Improved story coherence
- Character voice consistency
- Plot structure analysis
- Reader engagement prediction

## 9. Success Metrics

### Key Performance Indicators
- Response accuracy (valid Twee %)
- Generation speed (time to first token)
- User satisfaction (acceptance rate)
- Error rate (validation failures)
- Feature adoption (% users utilizing)

### Quality Metrics
- Story coherence score
- Choice meaningfulness rating
- Character consistency measure
- Plot complexity analysis
- Reader engagement tracking

## 10. Conclusion

The AI Co-Author feature will transform BranchEd from a visual editor into an intelligent story creation assistant. By maintaining strict adherence to Twee format while providing powerful AI capabilities, we can offer writers a tool that enhances creativity without compromising the integrity of their interactive fiction.

**Next Steps:**
1. Review and approve specification
2. Finalize security implementation approach
3. Create detailed API integration plan
4. Design user testing protocol
5. Begin Phase 1 implementation