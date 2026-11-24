---
name: Editable Theme System
description: Make Digital Menu templates deeply customizable through the existing editor without hardcoding visual settings.
---

# Editable Digital Menu Theme System

The Digital Menu customer should be able to customize the template from the existing editor.

## Core Principle

Separate:

1. Content
2. Theme
3. Layout
4. Components
5. Business logic

Do not hardcode everything directly into JSX.

## Editable Content

The template should support editable restaurant data such as:

- restaurant name
- logo
- description
- contact information
- address
- social links
- categories
- products
- product names
- descriptions
- prices
- images
- badges
- offers

Use the existing application data structure.

Do not invent a new incompatible data model.

## Editable Theme

Where supported by the existing editor architecture, allow customization of:

### Colors

- primary
- secondary
- background
- surface
- text
- muted text
- border
- buttons
- accent

### Typography

- heading font
- body font
- heading size
- body size
- font weight
- line height

### Shape

- border radius
- button radius
- card radius

### Effects

- shadows
- borders
- gradients
- overlays

### Layout

- container width
- section spacing
- card spacing
- grid columns
- alignment

## Sections

Allow sections to be enabled or disabled when compatible with the existing editor.

Examples:

- hero
- featured products
- offers
- categories
- reviews
- about
- contact

## Layout Variants

Where practical, support controlled variants such as:

Hero:

- large
- compact
- split

Menu:

- grid
- list
- horizontal

Product card:

- image-top
- image-left
- minimal
- large

Do not create hundreds of unnecessary options.

## CSS Architecture

Prefer theme variables or the project's existing theme mechanism.

Avoid scattering hardcoded colors throughout components.

Bad:

color: #2563EB

Better:

color: var(--primary)

or use the project's existing theme system.

## Critical Rule

Do not change the existing editor architecture blindly.

First inspect how the current editor stores and applies design settings.

Then integrate the new template with that system.

Do not create a parallel editor.

## Business Logic

Do not duplicate:

- cart logic
- checkout logic
- authentication
- ordering logic
- branch logic
- payment logic

Use the existing system.

The template controls presentation.

The application controls business logic.

## Deep Customization

The restaurant owner should be able to customize the visual appearance from the existing dashboard/editor without editing code.

### Typography

Support the existing editor's capabilities for:

- font family
- font size
- font weight
- line height
- letter spacing
- heading typography
- body typography

### Colors

Support customization of:

- primary color
- secondary color
- background color
- surface color
- text color
- muted text color
- accent color
- border color
- button colors

### Components

Where supported by the existing editor, allow customization of:

- buttons
- cards
- product cards
- category navigation
- badges
- inputs
- cart
- checkout UI

### Layout

Where supported:

- section spacing
- container width
- card radius
- button radius
- grid/list presentation
- section visibility
- section ordering

### Important

Do not invent a new editor.

Do not create template-specific customization systems.

Use the existing Digital Menu editor and existing theme persistence mechanism.

First inspect how the current editor stores and applies design settings.
