#!/usr/bin/env python3
"""
Claude integration for Takken.io Image Generator
This module provides structured prompts and examples for Claude to generate images
"""

CLAUDE_SYSTEM_PROMPT = """
You are an image generation assistant for takken.io. You have access to a comprehensive image generation toolset that creates production-grade images with consistent styling.

STYLE GUIDELINES:
- Use Dracula colour scheme exclusively
- Use FiraCode Nerd Font Mono for all text
- Use British English spelling (colour, centre, organise, etc.)
- Maintain consistent visual hierarchy
- Include proper UTF-8 symbols and emojis where appropriate

AVAILABLE IMAGE TYPES:
1. Terminal Windows - For command outputs, code examples
2. Diagrams - Technical architecture, flowcharts, connections
3. Charts - Bar charts, comparisons, performance metrics
4. Code Editors - Syntax-highlighted code snippets
5. Comparison Boxes - Feature comparisons, workflow options
6. Custom Compositions - Combine elements as needed

When given a description, analyse what type of image would best convey the information and generate appropriate Python code using the TakkenImageGenerator class.
"""

EXAMPLE_PROMPTS = {
    "terminal": """
    Example: "Show git commands for creating a new branch"
    
    Response:
    ```python
    generator = TakkenImageGenerator()
    img = generator.create_terminal_window([
        "$ git checkout main",
        "Switched to branch 'main'",
        "Your branch is up to date with 'origin/main'.",
        "",
        "$ git pull origin main",
        "Already up to date.",
        "",
        "$ git checkout -b feature/new-feature",
        "Switched to a new branch 'feature/new-feature'",
        "",
        "$ git status",
        "On branch feature/new-feature",
        "nothing to commit, working tree clean",
        "",
        "✅ New feature branch created successfully!"
    ], "Git Workflow", width=900, height=400)
    generator.save_image(img, output_path)
    ```
    """,
    
    "diagram": """
    Example: "Show microservices architecture with API gateway"
    
    Response:
    ```python
    generator = TakkenImageGenerator()
    elements = [
        {'id': 'gateway', 'text': '🌐 API Gateway', 'position': (400, 50), 'colour': 'purple'},
        {'id': 'auth', 'text': '🔐 Auth Service', 'position': (100, 200), 'colour': 'green'},
        {'id': 'users', 'text': '👥 User Service', 'position': (400, 200), 'colour': 'cyan'},
        {'id': 'orders', 'text': '📦 Order Service', 'position': (700, 200), 'colour': 'orange'},
        {'id': 'db', 'text': '🗄️ Database', 'position': (400, 350), 'colour': 'yellow'}
    ]
    connections = [
        {'from': 'gateway', 'to': 'auth', 'colour': 'green'},
        {'from': 'gateway', 'to': 'users', 'colour': 'green'},
        {'from': 'gateway', 'to': 'orders', 'colour': 'green'},
        {'from': 'auth', 'to': 'db', 'colour': 'yellow'},
        {'from': 'users', 'to': 'db', 'colour': 'yellow'},
        {'from': 'orders', 'to': 'db', 'colour': 'yellow'}
    ]
    img = generator.create_diagram(
        "🏗️ Microservices Architecture",
        elements,
        connections,
        width=1000,
        height=450
    )
    generator.save_image(img, output_path)
    ```
    """,
    
    "chart": """
    Example: "Compare performance of different bundlers"
    
    Response:
    ```python
    generator = TakkenImageGenerator()
    data = [
        ("Webpack", 100, 'orange'),
        ("Rollup", 85, 'green'),
        ("Parcel", 70, 'purple'),
        ("Vite", 45, 'cyan'),
        ("ESBuild", 15, 'yellow')
    ]
    img = generator.create_chart(
        'bar',
        data,
        "⚡ JavaScript Bundler Build Times (relative)",
        width=1000,
        height=600
    )
    generator.save_image(img, output_path)
    ```
    """,
    
    "comparison": """
    Example: "Compare cloud providers for hosting"
    
    Response:
    ```python
    generator = TakkenImageGenerator()
    data = [
        {
            'title': '☁️ AWS',
            'subtitle': 'Enterprise Standard',
            'colour': 'orange',
            'features': [
                '🌍 Global infrastructure',
                '🛠️ Comprehensive services',
                '📊 Advanced monitoring',
                '💰 Pay-as-you-go pricing'
            ],
            'rating': '⭐ Best for Scale'
        },
        {
            'title': '🌊 Azure',
            'subtitle': 'Microsoft Ecosystem',
            'colour': 'cyan',
            'features': [
                '🔗 Office 365 integration',
                '🪟 Windows optimised',
                '🤖 AI/ML services',
                '🏢 Enterprise focused'
            ],
            'rating': '⭐ Best for Microsoft'
        },
        {
            'title': '☁️ Google Cloud',
            'subtitle': 'Developer Friendly',
            'colour': 'green',
            'features': [
                '🚀 Kubernetes native',
                '📊 BigQuery analytics',
                '🤖 TensorFlow integration',
                '🌍 Clean energy focus'
            ],
            'rating': '⭐ Best for Innovation'
        }
    ]
    img = generator.create_comparison_boxes(
        data,
        "☁️ Cloud Provider Comparison",
        width=1200,
        height=500
    )
    generator.save_image(img, output_path)
    ```
    """
}

def get_claude_prompt(description):
    """Generate a prompt for Claude to create an image"""
    return f"""
Given this description: "{description}"

Please generate Python code using the TakkenImageGenerator class to create an appropriate image.

Consider:
1. What type of visualisation best suits this description?
2. What information should be displayed?
3. What icons and colours would enhance understanding?
4. How to structure the layout for clarity?

Generate complete Python code that creates the image.
"""