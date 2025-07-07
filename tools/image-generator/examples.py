#!/usr/bin/env python3
"""
Examples demonstrating the Takken.io Image Generator capabilities
Run this file to generate example images showcasing all features
"""

import os
from generator import TakkenImageGenerator

def create_example_images():
    """Generate a set of example images"""
    generator = TakkenImageGenerator()
    output_dir = "example-images"
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    print("🎨 Generating example images...\n")
    
    # Example 1: Terminal Window
    print("1️⃣ Creating terminal window example...")
    terminal_img = generator.create_terminal_window([
        "$ docker-compose up -d",
        "Creating network myapp_default",
        "Creating volume myapp_postgres_data",
        "Creating myapp_postgres_1 ... done",
        "Creating myapp_redis_1    ... done", 
        "Creating myapp_api_1      ... done",
        "Creating myapp_nginx_1    ... done",
        "",
        "$ docker-compose ps",
        "       Name                     Command               State           Ports",
        "--------------------------------------------------------------------------------",
        "myapp_api_1         node index.js                    Up      0.0.0.0:3000->3000/tcp",
        "myapp_nginx_1       nginx -g daemon off;             Up      0.0.0.0:80->80/tcp",
        "myapp_postgres_1    postgres                         Up      5432/tcp",
        "myapp_redis_1       redis-server                     Up      6379/tcp",
        "",
        "✅ All services running successfully!"
    ], "Docker Compose", width=900, height=450)
    generator.save_image(terminal_img, f"{output_dir}/terminal-example.png")
    
    # Example 2: Architecture Diagram
    print("2️⃣ Creating architecture diagram...")
    elements = [
        {'id': 'client', 'text': '💻 React Client', 'position': (50, 150), 'size': (200, 80), 'colour': 'cyan'},
        {'id': 'lb', 'text': '⚖️ Load Balancer', 'position': (350, 50), 'size': (200, 80), 'colour': 'purple'},
        {'id': 'api1', 'text': '🚀 API Server 1', 'position': (650, 50), 'size': (180, 80), 'colour': 'green'},
        {'id': 'api2', 'text': '🚀 API Server 2', 'position': (650, 150), 'size': (180, 80), 'colour': 'green'},
        {'id': 'api3', 'text': '🚀 API Server 3', 'position': (650, 270), 'size': (180, 80), 'colour': 'green'},
        {'id': 'cache', 'text': '⚡ Redis Cache', 'position': (350, 270), 'size': (200, 80), 'colour': 'orange'},
        {'id': 'db', 'text': '🗄️ PostgreSQL', 'position': (950, 150), 'size': (180, 80), 'colour': 'yellow'}
    ]
    connections = [
        {'from': 'client', 'to': 'lb', 'colour': 'cyan'},
        {'from': 'lb', 'to': 'api1', 'colour': 'green'},
        {'from': 'lb', 'to': 'api2', 'colour': 'green'},
        {'from': 'lb', 'to': 'api3', 'colour': 'green'},
        {'from': 'api1', 'to': 'cache', 'colour': 'orange'},
        {'from': 'api2', 'to': 'cache', 'colour': 'orange'},
        {'from': 'api3', 'to': 'cache', 'colour': 'orange'},
        {'from': 'api1', 'to': 'db', 'colour': 'yellow'},
        {'from': 'api2', 'to': 'db', 'colour': 'yellow'},
        {'from': 'api3', 'to': 'db', 'colour': 'yellow'}
    ]
    arch_img = generator.create_diagram(
        "🏗️ Scalable Web Application Architecture",
        elements,
        connections,
        width=1200,
        height=400
    )
    generator.save_image(arch_img, f"{output_dir}/architecture-example.png")
    
    # Example 3: Performance Chart
    print("3️⃣ Creating performance chart...")
    chart_data = [
        ("Python\nDjango", 65, 'green'),
        ("Node.js\nExpress", 85, 'yellow'),
        ("Go\nGin", 95, 'cyan'),
        ("Rust\nActix", 98, 'orange'),
        ("Java\nSpring", 75, 'purple')
    ]
    chart_img = generator.create_chart(
        'bar',
        chart_data,
        "🚀 Web Framework Performance Comparison (req/sec)",
        width=1000,
        height=600
    )
    generator.save_image(chart_img, f"{output_dir}/chart-example.png")
    
    # Example 4: Feature Comparison
    print("4️⃣ Creating comparison boxes...")
    comparison_data = [
        {
            'title': '🆓 Free Tier',
            'subtitle': 'Getting Started',
            'colour': 'green',
            'features': [
                '✅ 1 GB storage',
                '✅ 10,000 requests/month',
                '✅ Community support',
                '❌ No custom domain',
                '❌ No SSL certificate'
            ],
            'rating': '⭐ Good for Testing'
        },
        {
            'title': '💼 Pro Tier',
            'subtitle': 'Small Business',
            'colour': 'purple',
            'features': [
                '✅ 100 GB storage',
                '✅ 1M requests/month',
                '✅ Priority support',
                '✅ Custom domain',
                '✅ SSL certificate'
            ],
            'rating': '⭐⭐ Best Value'
        },
        {
            'title': '🏢 Enterprise',
            'subtitle': 'Large Scale',
            'colour': 'orange',
            'features': [
                '✅ Unlimited storage',
                '✅ Unlimited requests',
                '✅ 24/7 phone support',
                '✅ Multiple domains',
                '✅ Advanced analytics'
            ],
            'rating': '⭐⭐⭐ Full Features'
        }
    ]
    comparison_img = generator.create_comparison_boxes(
        comparison_data,
        "💰 Pricing Tier Comparison",
        width=1200,
        height=500
    )
    generator.save_image(comparison_img, f"{output_dir}/comparison-example.png")
    
    # Example 5: Code Editor
    print("5️⃣ Creating code editor example...")
    code_content = """# Fibonacci sequence generator
def fibonacci(n):
    \"\"\"Generate Fibonacci sequence up to n terms\"\"\"
    if n <= 0:
        return []
    elif n == 1:
        return [0]
    elif n == 2:
        return [0, 1]
    
    # Generate sequence
    fib_sequence = [0, 1]
    for i in range(2, n):
        next_num = fib_sequence[i-1] + fib_sequence[i-2]
        fib_sequence.append(next_num)
    
    return fib_sequence

# Example usage
if __name__ == "__main__":
    result = fibonacci(10)
    print(f"First 10 Fibonacci numbers: {result}")
    # Output: [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]"""
    
    code_img = generator.create_code_editor(
        code_content,
        'python',
        'fibonacci.py',
        width=900,
        height=600
    )
    generator.save_image(code_img, f"{output_dir}/code-example.png")
    
    print("\n✅ All example images generated successfully!")
    print(f"📁 Images saved to: {os.path.abspath(output_dir)}/")

if __name__ == "__main__":
    create_example_images()