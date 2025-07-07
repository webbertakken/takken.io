#!/bin/bash
# Test script for the image generator integration

echo "🧪 Testing Takken.io Image Generator Integration"
echo "================================================"
echo ""

# Check Python installation
echo "✓ Checking Python..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed"
    exit 1
fi
python3 --version

# Check Pillow installation
echo ""
echo "✓ Checking Pillow..."
python3 -c "import PIL; print(f'Pillow version: {PIL.__version__}')" || {
    echo "❌ Pillow is not installed. Run: pip install Pillow"
    exit 1
}

# Check font directory
echo ""
echo "✓ Checking Nerd Font..."
FONT_DIR="/home/webber/Setup/FiraCode Nerd Font Mono"
if [ -d "$FONT_DIR" ]; then
    echo "Font directory found: $FONT_DIR"
    # shellcheck disable=SC2012
    ls "$FONT_DIR"/*.ttf | wc -l | xargs -I {} echo "Found {} font files"
else
    echo "⚠️  Font directory not found: $FONT_DIR"
    echo "Images will use fallback font"
fi

# Run examples
echo ""
echo "✓ Running example generation..."
cd "$(dirname "$0")" || exit
python3 examples.py

echo ""
echo "✅ Integration test complete!"
echo ""
echo "To use the image generator:"
echo "  yarn generate-image \"Your image description here\""
echo ""
echo "Examples:"
echo "  yarn generate-image \"Terminal showing git workflow\""
echo "  yarn generate-image \"Architecture diagram for microservices\""
echo "  yarn generate-image \"Performance comparison chart\""
