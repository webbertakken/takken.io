#!/usr/bin/env python3
"""
Takken.io Image Generator - Image generation toolset
Designed for Claude Code integration
"""

import os
import sys
import json
import argparse
from PIL import Image, ImageDraw, ImageFont
from datetime import datetime
from pathlib import Path

# Dracula colour scheme (official)
COLOURS = {
    'background': '#282a36',
    'current_line': '#44475a',
    'foreground': '#f8f8f2',
    'comment': '#6272a4',
    'cyan': '#8be9fd',
    'green': '#50fa7b',
    'orange': '#ffb86c',
    'pink': '#ff79c6',
    'purple': '#bd93f9',
    'red': '#ff5555',
    'yellow': '#f1fa8c',

    # Additional colours for depth
    'dark_bg': '#21222c',
    'light_bg': '#44475a',
    'accent': '#6272a4',
    'selection': '#44475a'
}

# Typography settings
FONTS = {
    'primary': 'FiraCode Nerd Font Mono',
    'fallback': 'Courier New',
    'weights': {
        'regular': 'FiraCodeNerdFontMono-Regular.ttf',
        'medium': 'FiraCodeNerdFontMono-Medium.ttf',
        'bold': 'FiraCodeNerdFontMono-Bold.ttf',
        'light': 'FiraCodeNerdFontMono-Light.ttf'
    }
}

# British English spelling preferences
BRITISH_ENGLISH = {
    'color': 'colour',
    'center': 'centre',
    'organize': 'organise',
    'analyze': 'analyse',
    'realize': 'realise',
    'optimize': 'optimise',
    'synchronize': 'synchronise',
    'visualization': 'visualisation'
}

class TakkenImageGenerator:
    """Main image generation class with consistent styling"""

    def __init__(self, font_path="/home/webber/Setup/FiraCode Nerd Font Mono"):
        self.font_path = font_path
        self.colours = COLOURS
        self.default_width = 1000
        self.default_height = 600

    def get_font(self, size, weight='regular'):
        """Get Nerd Font with proper fallback"""
        try:
            font_file = os.path.join(self.font_path, FONTS['weights'][weight])
            return ImageFont.truetype(font_file, size)
        except:
            try:
                return ImageFont.truetype(FONTS['fallback'], size)
            except:
                return ImageFont.load_default()

    def create_base_image(self, width=None, height=None, background=None):
        """Create base image with default styling"""
        w = width or self.default_width
        h = height or self.default_height
        bg = background or self.colours['background']
        return Image.new('RGB', (w, h), bg)

    def draw_rounded_rect(self, draw, coords, radius, fill=None, outline=None, width=1):
        """Draw a rounded rectangle"""
        x1, y1, x2, y2 = coords

        # Main rectangles
        if fill:
            draw.rectangle([x1+radius, y1, x2-radius, y2], fill=fill)
            draw.rectangle([x1, y1+radius, x2, y2-radius], fill=fill)

            # Corners
            draw.ellipse([x1, y1, x1+2*radius, y1+2*radius], fill=fill)
            draw.ellipse([x2-2*radius, y1, x2, y1+2*radius], fill=fill)
            draw.ellipse([x1, y2-2*radius, x1+2*radius, y2], fill=fill)
            draw.ellipse([x2-2*radius, y2-2*radius, x2, y2], fill=fill)

        if outline:
            # Draw outline arcs for corners
            draw.arc([x1, y1, x1+2*radius, y1+2*radius], 180, 270, fill=outline, width=width)
            draw.arc([x2-2*radius, y1, x2, y1+2*radius], 270, 0, fill=outline, width=width)
            draw.arc([x1, y2-2*radius, x1+2*radius, y2], 90, 180, fill=outline, width=width)
            draw.arc([x2-2*radius, y2-2*radius, x2, y2], 0, 90, fill=outline, width=width)

            # Lines
            draw.line([x1+radius, y1, x2-radius, y1], fill=outline, width=width)
            draw.line([x1+radius, y2, x2-radius, y2], fill=outline, width=width)
            draw.line([x1, y1+radius, x1, y2-radius], fill=outline, width=width)
            draw.line([x2, y1+radius, x2, y2-radius], fill=outline, width=width)

    def create_terminal_window(self, content_lines, title="Terminal", width=900, height=500):
        """Create a terminal window with proper styling"""
        img = self.create_base_image(width, height)
        draw = ImageDraw.Draw(img)

        # Terminal chrome
        chrome_height = 35
        draw.rectangle([0, 0, width, chrome_height], fill=self.colours['light_bg'])

        # Traffic lights
        traffic_y = chrome_height // 2 - 6
        draw.ellipse([15, traffic_y, 27, traffic_y + 12], fill=self.colours['red'])
        draw.ellipse([35, traffic_y, 47, traffic_y + 12], fill=self.colours['yellow'])
        draw.ellipse([55, traffic_y, 67, traffic_y + 12], fill=self.colours['green'])

        # Title
        title_font = self.get_font(14, 'medium')
        title_with_icon = f" {title}"
        title_bbox = draw.textbbox((0, 0), title_with_icon, font=title_font)
        title_width = title_bbox[2] - title_bbox[0]
        draw.text((width // 2 - title_width // 2, chrome_height // 2 - 8),
                 title_with_icon, fill=self.colours['foreground'], font=title_font)

        # Content
        line_font = self.get_font(13)
        line_height = 20

        for i, line in enumerate(content_lines):
            y = chrome_height + 15 + i * line_height
            if y > height - 25:
                break

            # Syntax highlighting
            colour = self.get_line_colour(line)
            draw.text((15, y), line, fill=colour, font=line_font)

        return img

    def get_line_colour(self, line):
        """Determine line colour based on content"""
        if line.startswith('PS>') or line.startswith('$'):
            return self.colours['green']
        elif '✅' in line or 'success' in line.lower():
            return self.colours['green']
        elif '⚠️' in line or 'warning' in line.lower():
            return self.colours['yellow']
        elif '❌' in line or 'error' in line.lower():
            return self.colours['red']
        elif any(emoji in line for emoji in ['📁', '📊', '🔄', '⚡', '🔗', '📄', '📂']):
            return self.colours['cyan']
        elif line.startswith('#'):
            return self.colours['comment']
        elif line.startswith('├─') or line.startswith('└─'):
            return self.colours['comment']
        else:
            return self.colours['foreground']

    def create_diagram(self, title, elements, connections=None, width=1200, height=600):
        """Create a technical diagram with boxes and connections"""
        img = self.create_base_image(width, height)
        draw = ImageDraw.Draw(img)

        # Title
        title_font = self.get_font(26, 'bold')
        title_bbox = draw.textbbox((0, 0), title, font=title_font)
        title_width = title_bbox[2] - title_bbox[0]
        draw.text(((width - title_width) // 2, 30), title,
                 fill=self.colours['foreground'], font=title_font)

        # Draw elements
        element_positions = {}
        for element in elements:
            x, y = element['position']
            w, h = element.get('size', (250, 120))
            colour = self.colours[element.get('colour', 'purple')]

            self.draw_rounded_rect(draw, [x, y, x + w, y + h], 10,
                                  fill=self.colours['dark_bg'],
                                  outline=colour, width=2)

            # Element text
            text_font = self.get_font(16, 'bold')
            text = element['text']
            text_bbox = draw.textbbox((0, 0), text, font=text_font)
            text_width = text_bbox[2] - text_bbox[0]
            draw.text((x + (w - text_width) // 2, y + 20), text,
                     fill=colour, font=text_font)

            # Store position for connections
            element_positions[element['id']] = (x + w // 2, y + h // 2)

        # Draw connections
        if connections:
            for conn in connections:
                start = element_positions[conn['from']]
                end = element_positions[conn['to']]
                colour = self.colours[conn.get('colour', 'green')]

                draw.line([start[0], start[1], end[0], end[1]],
                         fill=colour, width=3)

                # Arrow head
                if conn.get('arrow', True):
                    self.draw_arrow_head(draw, start, end, colour)

        return img

    def draw_arrow_head(self, draw, start, end, colour):
        """Draw an arrow head pointing from start to end"""
        import math

        # Calculate angle
        dx = end[0] - start[0]
        dy = end[1] - start[1]
        angle = math.atan2(dy, dx)

        # Arrow head size
        head_length = 15
        head_angle = math.pi / 6

        # Calculate arrow points
        x1 = end[0] - head_length * math.cos(angle - head_angle)
        y1 = end[1] - head_length * math.sin(angle - head_angle)
        x2 = end[0] - head_length * math.cos(angle + head_angle)
        y2 = end[1] - head_length * math.sin(angle + head_angle)

        draw.polygon([end[0], end[1], x1, y1, x2, y2], fill=colour)

    def create_chart(self, chart_type, data, title, width=1000, height=600):
        """Create various types of charts"""
        if chart_type == 'bar':
            return self.create_bar_chart(data, title, width, height)
        elif chart_type == 'comparison':
            return self.create_comparison_boxes(data, title, width, height)
        else:
            raise ValueError(f"Unsupported chart type: {chart_type}")

    def create_bar_chart(self, data, title, width, height):
        """Create a bar chart with Dracula styling"""
        img = self.create_base_image(width, height)
        draw = ImageDraw.Draw(img)

        # Title
        title_font = self.get_font(24, 'bold')
        title_bbox = draw.textbbox((0, 0), title, font=title_font)
        title_width = title_bbox[2] - title_bbox[0]
        draw.text(((width - title_width) // 2, 30), title,
                 fill=self.colours['foreground'], font=title_font)

        # Chart area
        margin = 100
        chart_left = margin
        chart_right = width - margin
        chart_top = 120
        chart_bottom = height - 100
        chart_width = chart_right - chart_left
        chart_height = chart_bottom - chart_top

        # Draw grid
        grid_font = self.get_font(12)
        for i in range(0, 101, 25):
            y = chart_bottom - (i / 100) * chart_height
            draw.line([chart_left, y, chart_right, y],
                     fill=self.colours['comment'], width=1)
            draw.text((chart_left - 40, y - 8), f"{i}%",
                     fill=self.colours['comment'], font=grid_font)

        # Draw bars
        bar_width = chart_width // (len(data) + 1)
        for i, (label, value, colour_key) in enumerate(data):
            bar_height = (value / 100) * chart_height
            bar_x = chart_left + (i + 1) * bar_width - bar_width // 3
            bar_y = chart_bottom - bar_height
            colour = self.colours[colour_key]

            # Draw bar
            draw.rectangle([bar_x, bar_y, bar_x + bar_width // 2, chart_bottom],
                          fill=colour)

            # Value label
            value_font = self.get_font(14, 'bold')
            value_text = f"{value}%"
            value_bbox = draw.textbbox((0, 0), value_text, font=value_font)
            value_width = value_bbox[2] - value_bbox[0]
            draw.text((bar_x + (bar_width // 2 - value_width) // 2, bar_y - 25),
                     value_text, fill=self.colours['foreground'], font=value_font)

            # Label
            label_font = self.get_font(12)
            label_lines = label.split('\n')
            for j, line in enumerate(label_lines):
                line_bbox = draw.textbbox((0, 0), line, font=label_font)
                line_width = line_bbox[2] - line_bbox[0]
                draw.text((bar_x + (bar_width // 2 - line_width) // 2,
                          chart_bottom + 10 + j * 16), line,
                         fill=self.colours['foreground'], font=label_font)

        return img

    def create_comparison_boxes(self, data, title, width, height):
        """Create comparison boxes with ratings"""
        img = self.create_base_image(width, height)
        draw = ImageDraw.Draw(img)

        # Title
        title_font = self.get_font(24, 'bold')
        title_bbox = draw.textbbox((0, 0), title, font=title_font)
        title_width = title_bbox[2] - title_bbox[0]
        draw.text(((width - title_width) // 2, 25), title,
                 fill=self.colours['foreground'], font=title_font)

        # Calculate box layout
        num_boxes = len(data)
        box_width = min(350, (width - 100) // num_boxes - 20)
        box_height = height - 180
        spacing = (width - num_boxes * box_width) // (num_boxes + 1)

        for i, item in enumerate(data):
            x = spacing + i * (box_width + spacing)
            y = 90
            colour = self.colours[item['colour']]

            # Main box
            self.draw_rounded_rect(draw, [x, y, x + box_width, y + box_height],
                                  12, outline=colour, width=3)

            # Header
            header_height = 60
            draw.rectangle([x + 3, y + 3, x + box_width - 3, y + header_height],
                          fill=colour)

            # Title
            title_font = self.get_font(18, 'bold')
            item_title = item['title']
            title_bbox = draw.textbbox((0, 0), item_title, font=title_font)
            title_width = title_bbox[2] - title_bbox[0]
            draw.text((x + (box_width - title_width) // 2, y + 20),
                     item_title, fill=self.colours['background'], font=title_font)

            # Subtitle
            if 'subtitle' in item:
                subtitle_font = self.get_font(14)
                subtitle = item['subtitle']
                subtitle_bbox = draw.textbbox((0, 0), subtitle, font=subtitle_font)
                subtitle_width = subtitle_bbox[2] - subtitle_bbox[0]
                draw.text((x + (box_width - subtitle_width) // 2, y + 70),
                         subtitle, fill=colour, font=subtitle_font)

            # Features
            feature_font = self.get_font(13)
            for j, feature in enumerate(item.get('features', [])):
                draw.text((x + 20, y + 110 + j * 25), f"• {feature}",
                         fill=self.colours['foreground'], font=feature_font)

            # Rating
            if 'rating' in item:
                rating_font = self.get_font(15, 'bold')
                rating = item['rating']
                rating_bbox = draw.textbbox((0, 0), rating, font=rating_font)
                rating_width = rating_bbox[2] - rating_bbox[0]
                draw.text((x + (box_width - rating_width) // 2, y + box_height - 40),
                         rating, fill=colour, font=rating_font)

        return img

    def create_code_editor(self, content, language, title, width=900, height=600):
        """Create a code editor mockup with syntax highlighting"""
        img = self.create_base_image(width, height)
        draw = ImageDraw.Draw(img)

        # Editor header
        header_height = 40
        draw.rectangle([0, 0, width, header_height], fill=self.colours['light_bg'])

        # File icon and title
        header_font = self.get_font(16, 'medium')
        icon = self.get_file_icon(language)
        draw.text((20, 12), f"{icon} {title}",
                 fill=self.colours['foreground'], font=header_font)

        # Content area with line numbers
        line_font = self.get_font(13)
        line_num_font = self.get_font(11)
        line_height = 18

        for i, line in enumerate(content.split('\n')):
            y = header_height + 15 + i * line_height
            if y > height - 25:
                break

            # Line number
            draw.text((10, y), f"{i+1:3d}",
                     fill=self.colours['comment'], font=line_num_font)

            # Syntax highlighted content
            x = 50
            self.draw_syntax_highlighted_line(draw, line, x, y, language, line_font)

        return img

    def get_file_icon(self, language):
        """Get appropriate file icon for language"""
        icons = {
            'python': '',
            'javascript': '',
            'typescript': '',
            'yaml': '',
            'json': '',
            'markdown': '',
            'powershell': '',
            'bash': '',
            'html': '',
            'css': '',
            'default': ''
        }
        return icons.get(language.lower(), icons['default'])

    def draw_syntax_highlighted_line(self, draw, line, x, y, language, font):
        """Draw a syntax highlighted line based on language"""
        if language in ['yaml', 'yml']:
            if line.strip().startswith('#'):
                draw.text((x, y), line, fill=self.colours['comment'], font=font)
            elif ':' in line and not line.strip().startswith('-'):
                parts = line.split(':', 1)
                draw.text((x, y), parts[0], fill=self.colours['cyan'], font=font)
                if len(parts) > 1:
                    key_bbox = draw.textbbox((0, 0), parts[0], font=font)
                    key_width = key_bbox[2] - key_bbox[0]
                    draw.text((x + key_width, y), ':', fill=self.colours['foreground'], font=font)
                    draw.text((x + key_width + 10, y), parts[1], fill=self.colours['yellow'], font=font)
            elif line.strip().startswith('-'):
                draw.text((x, y), line, fill=self.colours['green'], font=font)
            else:
                draw.text((x, y), line, fill=self.colours['foreground'], font=font)
        else:
            # Default syntax highlighting
            draw.text((x, y), line, fill=self.colours['foreground'], font=font)

    def save_image(self, img, output_path):
        """Save image with metadata"""
        # Add metadata
        from PIL import PngImagePlugin
        metadata = PngImagePlugin.PngInfo()
        metadata.add_text("Software", "Takken.io Image Generator")
        metadata.add_text("Created", datetime.now().isoformat())

        # Save
        img.save(output_path, "PNG", pnginfo=metadata)
        print(f"✅ Image saved to: {output_path}")

    def generate_from_description(self, description, output_path):
        """Main entry point for generating images from description"""
        # This is where Claude will interpret the description and call appropriate methods
        # For now, return a placeholder implementation
        img = self.create_terminal_window(
            ["# Image generation from description",
             "# Description: " + description,
             "",
             "✅ Image will be generated based on the description"],
            "Image Generator"
        )
        self.save_image(img, output_path)
        return output_path


def main():
    """CLI entry point"""
    parser = argparse.ArgumentParser(description='Takken.io Image Generator')
    parser.add_argument('description', help='Description of the image to generate')
    parser.add_argument('-o', '--output', help='Output file path',
                       default='generated_image.png')
    parser.add_argument('--width', type=int, help='Image width', default=1000)
    parser.add_argument('--height', type=int, help='Image height', default=600)

    args = parser.parse_args()

    generator = TakkenImageGenerator()
    output_path = generator.generate_from_description(
        args.description,
        args.output
    )

    print(f"Image generated: {output_path}")


if __name__ == "__main__":
    main()
