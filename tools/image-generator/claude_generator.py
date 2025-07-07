#!/usr/bin/env python3
"""
Claude-powered image generation for Takken.io
This module interprets natural language descriptions and generates appropriate images
"""

import re
import json
import subprocess
import tempfile
from generator import TakkenImageGenerator

class ClaudeImageGenerator(TakkenImageGenerator):
    """Extended image generator with natural language processing"""
    
    def __init__(self, font_path="/home/webber/Setup/FiraCode Nerd Font Mono"):
        super().__init__(font_path)
        self.keywords = {
            'terminal': ['terminal', 'command', 'shell', 'bash', 'powershell', 'cli', 'console'],
            'diagram': ['architecture', 'diagram', 'flow', 'system', 'microservices', 'infrastructure'],
            'chart': ['chart', 'graph', 'comparison', 'performance', 'benchmark', 'metrics'],
            'code': ['code', 'syntax', 'programming', 'function', 'class', 'snippet'],
            'comparison': ['compare', 'versus', 'vs', 'options', 'features', 'pros', 'cons']
        }
    
    def generate_from_description(self, description, output_path):
        """Generate image based on natural language description"""
        print(f"🤖 Processing: {description}")
        
        # Analyse the description to determine image type
        image_type = self.detect_image_type(description)
        print(f"📊 Detected type: {image_type}")
        
        # Generate appropriate image based on type
        img = None
        if image_type == 'terminal':
            img = self.generate_terminal_from_description(description)
        elif image_type == 'diagram':
            img = self.generate_diagram_from_description(description)
        elif image_type == 'chart':
            img = self.generate_chart_from_description(description)
        elif image_type == 'code':
            img = self.generate_code_from_description(description)
        elif image_type == 'comparison':
            img = self.generate_comparison_from_description(description)
        else:
            img = self.generate_generic_from_description(description)
        
        if img is None:
            self._handle_error("Image generation failed", "Could not generate image from description")
        
        self.save_image(img, output_path)
        return output_path
    
    def detect_image_type(self, description):
        """Detect the most appropriate image type from description"""
        description_lower = description.lower()
        
        # Count keyword matches for each type
        scores = {}
        for img_type, keywords in self.keywords.items():
            score = sum(1 for keyword in keywords if keyword in description_lower)
            if score > 0:
                scores[img_type] = score
        
        # Return type with highest score, or 'terminal' as default
        return max(scores.items(), key=lambda x: x[1])[0] if scores else 'terminal'
    
    def generate_terminal_from_description(self, description):
        """Generate terminal window based on description"""
        # Extract technology/tool from description
        tools = {
            'docker': {
                'commands': [
                    "$ docker --version",
                    "Docker version 24.0.7, build afdd53b",
                    "",
                    "$ docker-compose up -d",
                    "Creating network myapp_default",
                    "Creating myapp_postgres_1 ... ✅",
                    "Creating myapp_redis_1    ... ✅",  
                    "Creating myapp_api_1      ... ✅",
                    "",
                    "$ docker ps",
                    "CONTAINER ID   IMAGE     COMMAND                  STATUS",
                    "abc123def456   postgres  \"postgres\"               Up 30 seconds",
                    "def456ghi789   redis     \"redis-server\"           Up 29 seconds",
                    "ghi789jkl012   node      \"npm start\"              Up 28 seconds",
                    "",
                    "✅ All containers running successfully!"
                ],
                'title': 'Docker Development'
            },
            'git': {
                'commands': [
                    "$ git status",
                    "On branch main",
                    "Your branch is up to date with 'origin/main'.",
                    "",
                    "$ git checkout -b feature/new-api",
                    "Switched to a new branch 'feature/new-api'",
                    "",
                    "$ git add .",
                    "$ git commit -m \"Add new API endpoints\"",
                    "[feature/new-api 1a2b3c4] Add new API endpoints",
                    " 3 files changed, 45 insertions(+), 2 deletions(-)",
                    "",
                    "$ git push -u origin feature/new-api",
                    "Enumerating objects: 8, done.",
                    "To github.com:user/repo.git",
                    " * [new branch]      feature/new-api -> feature/new-api",
                    "",
                    "✅ Feature branch created and pushed!"
                ],
                'title': 'Git Workflow'
            },
            'npm': {
                'commands': [
                    "$ npm init -y",
                    "Wrote to package.json",
                    "",
                    "$ npm install express typescript @types/node",
                    "added 847 packages in 15.2s",
                    "",
                    "$ npm run build",
                    "✅ Typescript compilation successful",
                    "",
                    "$ npm start",
                    "🚀 Server running on http://localhost:3000",
                    "📊 Environment: development",
                    "🔗 Database connected",
                    "",
                    "✅ Application started successfully!"
                ],
                'title': 'Node.js Development'
            },
            'python': {
                'commands': [
                    "$ python --version",
                    "Python 3.11.5",
                    "",
                    "$ pip install fastapi uvicorn pytest",
                    "Collecting fastapi...",
                    "Successfully installed fastapi-0.104.1 uvicorn-0.24.0",
                    "",
                    "$ python -m pytest tests/",
                    "======================== test session starts ========================",
                    "collected 15 items",
                    "",
                    "tests/test_api.py ............... [100%]",
                    "",
                    "======================== 15 passed in 2.34s ========================",
                    "",
                    "✅ All tests passing!"
                ],
                'title': 'Python Development'
            },
            'kubernetes': {
                'commands': [
                    "$ kubectl get pods",
                    "NAME                     READY   STATUS    RESTARTS   AGE",
                    "api-deployment-abc123    1/1     Running   0          2m",
                    "api-deployment-def456    1/1     Running   0          2m",
                    "redis-789ghi             1/1     Running   0          5m",
                    "",
                    "$ kubectl get services",
                    "NAME           TYPE           CLUSTER-IP      EXTERNAL-IP",
                    "api-service    LoadBalancer   10.96.1.100     <pending>",
                    "redis-service  ClusterIP      10.96.1.200     <none>",
                    "",
                    "$ kubectl logs api-deployment-abc123",
                    "🚀 API server started on port 8080",
                    "📊 Connected to Redis",
                    "✅ Health check passed",
                    "",
                    "✅ Kubernetes cluster healthy!"
                ],
                'title': 'Kubernetes Management'
            }
        }
        
        # Find matching tool
        description_lower = description.lower()
        for tool, config in tools.items():
            if tool in description_lower:
                return self.create_terminal_window(
                    config['commands'], 
                    config['title'],
                    width=900, 
                    height=len(config['commands']) * 20 + 100
                )
        
        # Default terminal if no specific tool found
        return self.create_terminal_window([
            "$ echo 'Image generation from description'",
            "Image generation from description",
            "",
            f"# Processing: {description}",
            "",
            "✅ Terminal simulation generated"
        ], "Command Line", width=800, height=200)
    
    def generate_diagram_from_description(self, description):
        """Generate architecture diagram based on description"""
        description_lower = description.lower()
        
        if 'microservices' in description_lower:
            return self.create_microservices_diagram()
        elif 'api' in description_lower and ('rest' in description_lower or 'database' in description_lower):
            return self.create_api_diagram()
        elif 'cicd' in description_lower or 'pipeline' in description_lower:
            return self.create_cicd_diagram()
        elif 'cloud' in description_lower:
            return self.create_cloud_diagram()
        else:
            return self.create_generic_system_diagram()
    
    def create_microservices_diagram(self):
        """Create a microservices architecture diagram"""
        elements = [
            {'id': 'client', 'text': '💻 React Client', 'position': (50, 100), 'size': (180, 80), 'colour': 'cyan'},
            {'id': 'mobile', 'text': '📱 Mobile App', 'position': (50, 220), 'size': (180, 80), 'colour': 'cyan'},
            {'id': 'gateway', 'text': '🌐 API Gateway', 'position': (350, 160), 'size': (200, 80), 'colour': 'purple'},
            {'id': 'auth', 'text': '🔐 Auth Service', 'position': (650, 50), 'size': (180, 80), 'colour': 'green'},
            {'id': 'user', 'text': '👥 User Service', 'position': (650, 160), 'size': (180, 80), 'colour': 'green'},
            {'id': 'order', 'text': '📦 Order Service', 'position': (650, 270), 'size': (180, 80), 'colour': 'green'},
            {'id': 'payment', 'text': '💳 Payment Service', 'position': (650, 380), 'size': (180, 80), 'colour': 'green'},
            {'id': 'db', 'text': '🗄️ Database', 'position': (950, 220), 'size': (150, 120), 'colour': 'yellow'}
        ]
        connections = [
            {'from': 'client', 'to': 'gateway', 'colour': 'purple'},
            {'from': 'mobile', 'to': 'gateway', 'colour': 'purple'},
            {'from': 'gateway', 'to': 'auth', 'colour': 'green'},
            {'from': 'gateway', 'to': 'user', 'colour': 'green'},
            {'from': 'gateway', 'to': 'order', 'colour': 'green'},
            {'from': 'gateway', 'to': 'payment', 'colour': 'green'},
            {'from': 'auth', 'to': 'db', 'colour': 'yellow'},
            {'from': 'user', 'to': 'db', 'colour': 'yellow'},
            {'from': 'order', 'to': 'db', 'colour': 'yellow'},
            {'from': 'payment', 'to': 'db', 'colour': 'yellow'}
        ]
        return self.create_diagram("🏗️ Microservices Architecture", elements, connections, 1200, 500)
    
    def create_api_diagram(self):
        """Create a REST API with database diagram"""
        elements = [
            {'id': 'client', 'text': '💻 Frontend', 'position': (50, 150), 'size': (180, 80), 'colour': 'cyan'},
            {'id': 'api', 'text': '🚀 REST API', 'position': (350, 150), 'size': (200, 80), 'colour': 'green'},
            {'id': 'cache', 'text': '⚡ Redis Cache', 'position': (650, 50), 'size': (180, 80), 'colour': 'orange'},
            {'id': 'db', 'text': '🗄️ PostgreSQL', 'position': (650, 220), 'size': (180, 80), 'colour': 'yellow'}
        ]
        connections = [
            {'from': 'client', 'to': 'api', 'colour': 'green'},
            {'from': 'api', 'to': 'cache', 'colour': 'orange'},
            {'from': 'api', 'to': 'db', 'colour': 'yellow'}
        ]
        return self.create_diagram("🔗 REST API Architecture", elements, connections, 900, 350)
    
    def create_cicd_diagram(self):
        """Create a CI/CD pipeline diagram"""
        elements = [
            {'id': 'dev', 'text': '👨‍💻 Developer', 'position': (50, 150), 'size': (150, 80), 'colour': 'cyan'},
            {'id': 'git', 'text': '📚 Git Repo', 'position': (250, 150), 'size': (150, 80), 'colour': 'purple'},
            {'id': 'ci', 'text': '🔄 CI Pipeline', 'position': (450, 150), 'size': (150, 80), 'colour': 'green'},
            {'id': 'build', 'text': '🏗️ Build & Test', 'position': (650, 50), 'size': (150, 80), 'colour': 'orange'},
            {'id': 'deploy', 'text': '🚀 Deploy', 'position': (650, 220), 'size': (150, 80), 'colour': 'yellow'},
            {'id': 'prod', 'text': '🌐 Production', 'position': (850, 150), 'size': (150, 80), 'colour': 'pink'}
        ]
        connections = [
            {'from': 'dev', 'to': 'git', 'colour': 'purple'},
            {'from': 'git', 'to': 'ci', 'colour': 'green'},
            {'from': 'ci', 'to': 'build', 'colour': 'orange'},
            {'from': 'ci', 'to': 'deploy', 'colour': 'yellow'},
            {'from': 'deploy', 'to': 'prod', 'colour': 'pink'}
        ]
        return self.create_diagram("🔄 CI/CD Pipeline", elements, connections, 1050, 320)
    
    def create_cloud_diagram(self):
        """Create a cloud infrastructure diagram"""
        elements = [
            {'id': 'user', 'text': '👤 Users', 'position': (50, 200), 'size': (150, 80), 'colour': 'cyan'},
            {'id': 'cdn', 'text': '🌍 CDN', 'position': (250, 100), 'size': (150, 80), 'colour': 'purple'},
            {'id': 'lb', 'text': '⚖️ Load Balancer', 'position': (250, 220), 'size': (150, 80), 'colour': 'orange'},
            {'id': 'app1', 'text': '🖥️ App Server 1', 'position': (450, 100), 'size': (150, 80), 'colour': 'green'},
            {'id': 'app2', 'text': '🖥️ App Server 2', 'position': (450, 220), 'size': (150, 80), 'colour': 'green'},
            {'id': 'db', 'text': '🗄️ Database', 'position': (650, 160), 'size': (150, 80), 'colour': 'yellow'}
        ]
        connections = [
            {'from': 'user', 'to': 'cdn', 'colour': 'purple'},
            {'from': 'user', 'to': 'lb', 'colour': 'orange'},
            {'from': 'lb', 'to': 'app1', 'colour': 'green'},
            {'from': 'lb', 'to': 'app2', 'colour': 'green'},
            {'from': 'app1', 'to': 'db', 'colour': 'yellow'},
            {'from': 'app2', 'to': 'db', 'colour': 'yellow'}
        ]
        return self.create_diagram("☁️ Cloud Infrastructure", elements, connections, 850, 360)
    
    def create_generic_system_diagram(self):
        """Create a generic system diagram"""
        elements = [
            {'id': 'input', 'text': '📥 Input', 'position': (100, 150), 'size': (150, 80), 'colour': 'cyan'},
            {'id': 'process', 'text': '⚙️ Processing', 'position': (350, 150), 'size': (150, 80), 'colour': 'green'},
            {'id': 'storage', 'text': '💾 Storage', 'position': (600, 150), 'size': (150, 80), 'colour': 'yellow'}
        ]
        connections = [
            {'from': 'input', 'to': 'process', 'colour': 'green'},
            {'from': 'process', 'to': 'storage', 'colour': 'yellow'}
        ]
        return self.create_diagram("🔧 System Overview", elements, connections, 900, 350)
    
    def generate_chart_data_from_description(self, description):
        """Generate appropriate chart data based on description using Claude-like analysis"""
        description_lower = description.lower()
        
        # Database/Storage performance comparisons
        if any(term in description_lower for term in ['database', 'storage', 'sql', 'nosql', 'mongodb', 'postgres']):
            return {
                'title': '🗄️ Database Performance Comparison',
                'data': [
                    ("Redis\n(In-Memory)", 95, 'red'),
                    ("MongoDB\n(Document)", 78, 'green'),
                    ("PostgreSQL\n(Relational)", 85, 'cyan'),
                    ("MySQL\n(Relational)", 82, 'orange'),
                    ("Elasticsearch\n(Search)", 88, 'yellow')
                ]
            }
        
        # Web framework performance
        elif any(term in description_lower for term in ['web framework', 'api framework', 'backend', 'server']):
            if 'python' in description_lower:
                return {
                    'title': '🐍 Python Web Framework Performance',
                    'data': [
                        ("FastAPI\n(Async)", 92, 'green'),
                        ("Flask\n(Micro)", 75, 'cyan'),
                        ("Django\n(Full-stack)", 68, 'orange'),
                        ("Tornado\n(Async)", 85, 'purple'),
                        ("Starlette\n(ASGI)", 90, 'yellow')
                    ]
                }
            elif 'javascript' in description_lower or 'node' in description_lower:
                return {
                    'title': '🟨 Node.js Framework Performance',
                    'data': [
                        ("Fastify\n(Fast)", 95, 'green'),
                        ("Express\n(Popular)", 78, 'yellow'),
                        ("Koa\n(Modern)", 82, 'cyan'),
                        ("Hapi\n(Enterprise)", 74, 'orange'),
                        ("NestJS\n(TypeScript)", 80, 'purple')
                    ]
                }
        
        # Frontend framework comparisons
        elif any(term in description_lower for term in ['frontend', 'react', 'vue', 'angular', 'svelte']):
            return {
                'title': '⚛️ Frontend Framework Bundle Size',
                'data': [
                    ("Svelte\n(Compiled)", 95, 'orange'),
                    ("Vue 3\n(Progressive)", 88, 'green'),
                    ("React\n(Library)", 75, 'cyan'),
                    ("Angular\n(Full Framework)", 60, 'red'),
                    ("Solid\n(Reactive)", 92, 'purple')
                ]
            }
        
        # Build tools and bundlers
        elif any(term in description_lower for term in ['build', 'bundler', 'webpack', 'vite', 'rollup']):
            return {
                'title': '📦 Build Tool Performance (Build Speed)',
                'data': [
                    ("Vite\n(ESBuild)", 98, 'purple'),
                    ("Turbopack\n(Rust)", 96, 'orange'),
                    ("ESBuild\n(Go)", 94, 'yellow'),
                    ("Rollup\n(Tree-shake)", 78, 'green'),
                    ("Webpack\n(Traditional)", 45, 'red')
                ]
            }
        
        # Cloud providers
        elif any(term in description_lower for term in ['cloud', 'aws', 'azure', 'google cloud', 'hosting']):
            return {
                'title': '☁️ Cloud Provider Market Share',
                'data': [
                    ("AWS\n(Amazon)", 85, 'orange'),
                    ("Microsoft\nAzure", 72, 'cyan'),
                    ("Google\nCloud", 65, 'green'),
                    ("Alibaba\nCloud", 45, 'yellow'),
                    ("DigitalOcean\n(Developer)", 38, 'purple')
                ]
            }
        
        # Programming languages
        elif any(term in description_lower for term in ['programming language', 'language popularity', 'coding']):
            return {
                'title': '💻 Programming Language Popularity',
                'data': [
                    ("JavaScript\n(Web)", 88, 'yellow'),
                    ("Python\n(Data/AI)", 85, 'green'),
                    ("TypeScript\n(Typed JS)", 78, 'cyan'),
                    ("Java\n(Enterprise)", 75, 'orange'),
                    ("Go\n(Systems)", 65, 'purple')
                ]
            }
        
        # Development tools
        elif any(term in description_lower for term in ['editor', 'ide', 'development tool']):
            return {
                'title': '🛠️ Developer Tool Satisfaction',
                'data': [
                    ("VS Code\n(Microsoft)", 92, 'cyan'),
                    ("JetBrains\nIDEs", 88, 'orange'),
                    ("Neovim\n(Terminal)", 85, 'green'),
                    ("Sublime\nText", 78, 'purple'),
                    ("Atom\n(GitHub)", 45, 'red')
                ]
            }
        
        # Testing frameworks
        elif any(term in description_lower for term in ['testing', 'test framework', 'unit test']):
            return {
                'title': '🧪 Testing Framework Adoption',
                'data': [
                    ("Jest\n(JavaScript)", 85, 'green'),
                    ("Pytest\n(Python)", 88, 'yellow'),
                    ("JUnit\n(Java)", 82, 'orange'),
                    ("Cypress\n(E2E)", 75, 'cyan'),
                    ("Playwright\n(Modern E2E)", 78, 'purple')
                ]
            }
        
        # Performance metrics (general)
        elif any(term in description_lower for term in ['performance', 'speed', 'benchmark', 'latency']):
            return {
                'title': '⚡ Performance Comparison',
                'data': [
                    ("Optimised\nSolution", 95, 'green'),
                    ("Standard\nApproach", 78, 'cyan'),
                    ("Legacy\nSystem", 45, 'orange'),
                    ("Baseline\nImplementation", 65, 'yellow'),
                    ("Experimental\nMethod", 82, 'purple')
                ]
            }
        
        return None
    
    def request_chart_data_from_claude(self, description):
        """Use Claude Code CLI to generate structured chart data"""
        prompt = f"""
Generate structured data for a bar chart based on this description: "{description}"

Use your knowledge to create realistic, relevant data. Search the internet if needed for current information.

Return JSON in this exact format:
{{
    "title": "Chart Title with appropriate emoji",
    "data": [
        ["Item Name\\nSubtitle", value_0_to_100, "colour_name"],
        ["Another Item\\nSubtitle", value_0_to_100, "colour_name"]
    ]
}}

Requirements:
- Available colours: red, green, cyan, orange, purple, yellow
- Use realistic data values (0-100) appropriate for the comparison
- Include the most relevant items for comparison (typically 3-8 items)
- Choose the number of items based on what makes sense for the topic
- Make the title descriptive with an appropriate emoji
- Use \\n in item names for multi-line labels where helpful
- Base data on realistic metrics, market share, or performance benchmarks
"""
        
        print("📝 CLAUDE CODE PROMPT:")
        print("=" * 60)
        print(prompt)
        print("=" * 60)
        
        try:
            # Use interactive claude command that can prompt user for permissions
            import tempfile
            import os
            import sys
            
            # Write prompt to temporary file for claude to read
            with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
                f.write(prompt)
                temp_file = f.name
            
            try:
                # Run claude fully interactively in foreground
                print("🔄 Running Claude Code...")
                print("💡 Claude may prompt you for permissions - please respond as needed")
                print("=" * 60)
                
                # Run with dangerous skip permissions to avoid blocking on permission prompts
                # This allows Claude to read the temp file without asking for user interaction
                result = subprocess.run(
                    ['claude', '--print', '--dangerously-skip-permissions', temp_file],
                    capture_output=True,
                    text=True,
                    timeout=60
                )
            finally:
                # Clean up temp file
                try:
                    os.unlink(temp_file)
                except:
                    pass
            
            if result.returncode == 0:
                response = result.stdout.strip()
                
                print("🤖 CLAUDE CODE RESPONSE:")
                print("=" * 60)
                print(response)
                print("=" * 60)
                
                # Try to extract JSON from the response first
                json_start = response.find('{')
                json_end = response.rfind('}') + 1
                
                if json_start != -1 and json_end > json_start:
                    json_str = response[json_start:json_end]
                    data = json.loads(json_str)
                    print(f"✅ Successfully parsed JSON chart data from response")
                    return data
                
                # If no JSON in response, check if Claude mentioned creating a file
                import re
                file_pattern = r'Created\s+[`"]?(/[^\s`"]+\.json)[`"]?'
                file_match = re.search(file_pattern, response)
                
                if file_match:
                    json_file_path = file_match.group(1)
                    print(f"📄 Found JSON file: {json_file_path}")
                    
                    try:
                        with open(json_file_path, 'r') as f:
                            data = json.load(f)
                        print(f"✅ Successfully parsed JSON chart data from file")
                        
                        # Clean up the file
                        try:
                            os.unlink(json_file_path)
                            print(f"🗑️  Cleaned up temporary file")
                        except:
                            pass
                            
                        return data
                    except (FileNotFoundError, json.JSONDecodeError) as e:
                        self._handle_error("File reading failed", f"Could not read JSON file {json_file_path}: {e}")
                
                # No JSON found in response or file
                self._handle_error("JSON parsing failed", "No valid JSON found in Claude response or created files")
            else:
                error_msg = result.stderr.strip() if result.stderr else "Unknown error"
                self._handle_error("Claude CLI failed", f"Exit code {result.returncode}: {error_msg}")
                
        except subprocess.TimeoutExpired:
            self._handle_error("Claude CLI timeout", "Request timed out after 60 seconds (Claude may be researching current data)")
        except subprocess.CalledProcessError as e:
            self._handle_error("Claude CLI process error", f"Process failed with exit code {e.returncode}")
        except json.JSONDecodeError as e:
            self._handle_error("JSON parsing failed", "Claude response was not valid JSON")
        except FileNotFoundError:
            self._handle_error("Claude CLI not found", "Please ensure Claude Code is installed and in PATH")
        except Exception as e:
            self._handle_error("Unexpected error", f"Unknown issue occurred: {str(e)}")
        
        return None
    
    def _handle_error(self, error_type, details):
        """Handle errors with clean, JavaScript-style output"""
        print()
        print(f"❌ ERROR: {error_type}")
        print(f"   {details}")
        print()
        print("💡 SOLUTION:")
        
        if "not found" in error_type.lower():
            print("   • Install Claude Code: https://claude.ai/code")
            print("   • Ensure 'claude' command is in your PATH")
            print("   • Try running 'claude --version' to verify installation")
        elif "timeout" in error_type.lower():
            print("   • Check your internet connection")
            print("   • Try again in a moment")
            print("   • Ensure Claude Code is properly authenticated")
        elif "json" in error_type.lower():
            print("   • Claude response was malformed")
            print("   • Try simplifying your chart description")
            print("   • Check if Claude Code is working: 'claude \"Hello world\"'")
        else:
            print("   • Check Claude Code installation")
            print("   • Try running the command again")
            print("   • Report issue if problem persists")
        
        print()
        # Exit the process cleanly like JavaScript tools do
        import sys
        sys.exit(1)
    
    def generate_chart_from_description(self, description):
        """Generate chart based on description using Claude Code CLI - REQUIRES Claude"""
        print("🤖 Requesting chart data from Claude Code...")
        
        try:
            claude_data = self.request_chart_data_from_claude(description)
            
            if claude_data and 'data' in claude_data and 'title' in claude_data:
                print(f"✅ Generated chart: {claude_data['title']}")
                return self.create_chart('bar', claude_data['data'], claude_data['title'], 1000, 600)
            else:
                self._handle_error("Invalid chart data structure", "Claude returned malformed data")
                
        except Exception as e:
            # Don't re-raise, just exit cleanly
            return None
    
    def create_performance_chart(self):
        """Create a performance comparison chart"""
        data = [
            ("Vanilla JS", 100, 'yellow'),
            ("React", 85, 'cyan'),
            ("Vue.js", 88, 'green'),
            ("Angular", 75, 'red'),
            ("Svelte", 95, 'orange')
        ]
        return self.create_chart('bar', data, "⚡ Frontend Framework Performance", 1000, 600)
    
    def create_framework_comparison(self):
        """Create framework comparison chart"""
        data = [
            ("Django", 85, 'green'),
            ("FastAPI", 95, 'cyan'),
            ("Flask", 78, 'yellow'),
            ("Express.js", 88, 'orange'),
            ("Spring Boot", 82, 'purple')
        ]
        return self.create_chart('bar', data, "🚀 Web Framework Comparison", 1000, 600)
    
    def create_language_comparison(self):
        """Create programming language comparison"""
        data = [
            ("Python", 70, 'yellow'),
            ("JavaScript", 85, 'green'),
            ("TypeScript", 88, 'cyan'),
            ("Go", 92, 'orange'),
            ("Rust", 96, 'red')
        ]
        return self.create_chart('bar', data, "📊 Programming Language Performance", 1000, 600)
    
    def create_generic_metrics_chart(self):
        """Create a generic metrics chart"""
        data = [
            ("Metric A", 75, 'green'),
            ("Metric B", 85, 'cyan'),
            ("Metric C", 92, 'orange'),
            ("Metric D", 68, 'yellow')
        ]
        return self.create_chart('bar', data, "📈 Metrics Overview", 1000, 600)
    
    def generate_comparison_from_description(self, description):
        """Generate comparison boxes from description"""
        description_lower = description.lower()
        
        if 'cloud' in description_lower:
            return self.create_cloud_comparison()
        elif 'pricing' in description_lower or 'plan' in description_lower:
            return self.create_pricing_comparison()
        elif 'editor' in description_lower or 'ide' in description_lower:
            return self.create_editor_comparison()
        else:
            return self.create_generic_comparison()
    
    def create_cloud_comparison(self):
        """Create cloud provider comparison"""
        data = [
            {
                'title': '☁️ AWS',
                'subtitle': 'Market Leader',
                'colour': 'orange',
                'features': [
                    '🌍 Global presence',
                    '🛠️ 200+ services',
                    '📊 Advanced monitoring',
                    '💼 Enterprise focus'
                ],
                'rating': '⭐⭐⭐ Most comprehensive'
            },
            {
                'title': '☁️ Google Cloud',
                'subtitle': 'Innovation First',
                'colour': 'green',
                'features': [
                    '🤖 AI/ML leadership',
                    '📊 BigQuery analytics',
                    '🔧 Kubernetes native',
                    '🌱 Sustainability focus'
                ],
                'rating': '⭐⭐ Best for innovation'
            },
            {
                'title': '☁️ Azure',
                'subtitle': 'Enterprise Ready',
                'colour': 'cyan',
                'features': [
                    '🪟 Microsoft integration',
                    '🏢 Hybrid cloud',
                    '🔐 Security first',
                    '📈 Rapid growth'
                ],
                'rating': '⭐⭐ Best for Windows'
            }
        ]
        return self.create_comparison_boxes(data, "☁️ Cloud Provider Comparison", 1200, 500)
    
    def create_pricing_comparison(self):
        """Create pricing tier comparison"""
        data = [
            {
                'title': '🆓 Free',
                'subtitle': 'Get Started',
                'colour': 'green',
                'features': [
                    '✅ Basic features',
                    '✅ Community support',
                    '❌ Limited storage',
                    '❌ No priority support'
                ],
                'rating': '💡 Perfect for testing'
            },
            {
                'title': '💼 Pro',
                'subtitle': 'Most Popular',
                'colour': 'purple',
                'features': [
                    '✅ All basic features',
                    '✅ Priority support',
                    '✅ Advanced analytics',
                    '✅ Custom integrations'
                ],
                'rating': '⭐ Best value'
            },
            {
                'title': '🏢 Enterprise',
                'subtitle': 'Full Power',
                'colour': 'orange',
                'features': [
                    '✅ Unlimited everything',
                    '✅ 24/7 support',
                    '✅ Custom contracts',
                    '✅ Dedicated team'
                ],
                'rating': '🚀 Maximum features'
            }
        ]
        return self.create_comparison_boxes(data, "💰 Pricing Comparison", 1200, 500)
    
    def create_editor_comparison(self):
        """Create code editor comparison"""
        data = [
            {
                'title': '🆚 VS Code',
                'subtitle': 'Popular Choice',
                'colour': 'cyan',
                'features': [
                    '🆓 Free and open',
                    '🔌 Rich extensions',
                    '⚡ Fast startup',
                    '🌐 Web development'
                ],
                'rating': '⭐⭐⭐ Best overall'
            },
            {
                'title': '🧠 IntelliJ',
                'subtitle': 'Enterprise Power',
                'colour': 'orange',
                'features': [
                    '🔧 Advanced refactoring',
                    '🐛 Excellent debugging',
                    '📊 Code analysis',
                    '💼 Enterprise features'
                ],
                'rating': '⭐⭐ Best for Java'
            },
            {
                'title': '⚡ Neovim',
                'subtitle': 'Terminal Power',
                'colour': 'green',
                'features': [
                    '⚡ Lightning fast',
                    '⌨️ Keyboard driven',
                    '🔧 Highly customisable',
                    '💪 Steep learning curve'
                ],
                'rating': '⭐⭐ Best for experts'
            }
        ]
        return self.create_comparison_boxes(data, "👨‍💻 Code Editor Comparison", 1200, 500)
    
    def create_generic_comparison(self):
        """Create generic comparison"""
        data = [
            {
                'title': '🔵 Option A',
                'subtitle': 'Balanced',
                'colour': 'cyan',
                'features': [
                    '✅ Good performance',
                    '✅ Moderate cost',
                    '✅ Easy to use',
                    '⚠️ Limited features'
                ],
                'rating': '⭐⭐ Good choice'
            },
            {
                'title': '🟢 Option B',
                'subtitle': 'Feature Rich',
                'colour': 'green',
                'features': [
                    '✅ Many features',
                    '✅ Great support',
                    '⚠️ Higher cost',
                    '⚠️ Learning curve'
                ],
                'rating': '⭐⭐⭐ Best features'
            },
            {
                'title': '🟡 Option C',
                'subtitle': 'Budget Friendly',
                'colour': 'yellow',
                'features': [
                    '✅ Low cost',
                    '✅ Simple setup',
                    '❌ Basic features',
                    '❌ Limited support'
                ],
                'rating': '⭐ Budget option'
            }
        ]
        return self.create_comparison_boxes(data, "⚖️ Options Comparison", 1200, 500)
    
    def generate_code_from_description(self, description):
        """Generate code editor image from description"""
        description_lower = description.lower()
        
        if 'python' in description_lower:
            return self.create_python_code()
        elif 'javascript' in description_lower or 'typescript' in description_lower:
            return self.create_javascript_code()
        elif 'yaml' in description_lower or 'config' in description_lower:
            return self.create_yaml_code()
        else:
            return self.create_generic_code()
    
    def create_python_code(self):
        """Create Python code example"""
        code = """def fibonacci_generator(n):
    \"\"\"Generate Fibonacci sequence up to n terms\"\"\"
    a, b = 0, 1
    count = 0
    
    while count < n:
        yield a
        a, b = b, a + b
        count += 1

# Example usage
if __name__ == "__main__":
    # Generate first 10 Fibonacci numbers
    fib_sequence = list(fibonacci_generator(10))
    print(f"Fibonacci sequence: {fib_sequence}")
    
    # Calculate sum of even Fibonacci numbers
    even_sum = sum(x for x in fib_sequence if x % 2 == 0)
    print(f"Sum of even numbers: {even_sum}")"""
        
        return self.create_code_editor(code, 'python', 'fibonacci.py', 900, 500)
    
    def create_javascript_code(self):
        """Create JavaScript code example"""
        code = """// Modern JavaScript API client
class ApiClient {
    constructor(baseUrl, apiKey) {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
    }
    
    async fetchData(endpoint) {
        try {
            const response = await fetch(`${this.baseUrl}/${endpoint}`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }
}

// Usage example
const client = new ApiClient('https://api.example.com', 'your-api-key');
const data = await client.fetchData('users');"""
        
        return self.create_code_editor(code, 'javascript', 'api-client.js', 900, 500)
    
    def create_yaml_code(self):
        """Create YAML configuration example"""
        code = """# Docker Compose configuration
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgres://user:pass@db:5432/myapp
    depends_on:
      - db
      - redis
    restart: unless-stopped
    
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
      
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:"""
        
        return self.create_code_editor(code, 'yaml', 'docker-compose.yml', 900, 600)
    
    def create_generic_code(self):
        """Create generic code example"""
        code = """// Generic example code
function processData(input) {
    // Validate input
    if (!input || typeof input !== 'object') {
        throw new Error('Invalid input provided');
    }
    
    // Process the data
    const result = {
        processed: true,
        timestamp: new Date().toISOString(),
        data: input
    };
    
    return result;
}

export { processData };"""
        
        return self.create_code_editor(code, 'javascript', 'processor.js', 900, 400)
    
    def generate_generic_from_description(self, description):
        """Generate a generic image when type cannot be determined"""
        img = self.create_terminal_window([
            "🎨 Takken.io Image Generator",
            "",
            f"📝 Request: {description}",
            "",
            "🤔 Could not determine specific image type",
            "💡 Try being more specific:",
            "   • 'Terminal showing docker commands'",
            "   • 'Architecture diagram for microservices'", 
            "   • 'Performance chart comparing frameworks'",
            "",
            "✅ Generic response generated"
        ], "Image Generation", width=1000, height=350)
        
        return img