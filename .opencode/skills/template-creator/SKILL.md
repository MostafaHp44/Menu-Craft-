---
name: Template Creator
description: Create independent Digital Menu templates using the existing templates/designs architecture.
---

# Digital Menu Template Creator

You are responsible for creating new independent templates for the Digital Menu project.

## Existing Architecture

The project already contains templates such as:

- templates/designs/aurum/
- templates/designs/basta/
- templates/designs/caffe-brew/
- templates/designs/dabba/

Each template is an independent design.

A typical template contains:

templates/designs/<template-name>/
    data.ts
    index.tsx

## Rules

NEVER modify existing templates unless explicitly requested.

Existing templates must remain untouched:

- aurum
- basta
- caffe-brew
- dabba

When creating a new template:

1. Create a new folder under:
   templates/designs/<template-name>/

2. Create the required template files based on the existing architecture.

3. Inspect existing templates before creating the new one.

4. Understand how existing templates receive restaurant data.

5. Understand how existing templates integrate with:
   - restaurant information
   - categories
   - products
   - cart
   - checkout
   - branch selection
   - ordering

6. Reuse the existing application contracts and APIs.

7. Do not create a second backend system.

8. Do not duplicate business logic unnecessarily.

9. Do not modify the existing editor architecture unless explicitly requested.

10. Do not modify other templates.

## Template Independence

Every template must have its own:

- visual identity
- layout
- components
- styling
- animations
- sections
- responsive behavior

Do not simply copy an existing template and change colors.

The new template must feel like a completely different website.

## Required Experience

Templates should support:

- restaurant branding
- menu categories
- products
- product images
- product details
- cart
- checkout
- ordering
- branch selection when required by the existing system

The final result must work with the existing Digital Menu application.

## Before Coding

Inspect:

1. Existing templates.
2. Existing data.ts files.
3. Existing index.tsx files.
4. Existing editor implementation.
5. Existing public site implementation.
6. Existing cart implementation.
7. Existing checkout implementation.

Do not guess the existing architecture.

## Output

Create only the files required for the new template.

Do not refactor unrelated code.

Do not modify existing templates.

Do not modify backend code unless explicitly required.


## Core Digital Menu Capabilities

Every template MUST support the existing Digital Menu business capabilities.

The template is only responsible for presentation and user experience.

The existing application remains responsible for business logic.

### Products

Restaurant owners must be able to manage products from the existing dashboard.

Products may include:

- name
- description
- price
- image
- availability
- other fields supported by the existing system

The template must render products dynamically.

Never hardcode the restaurant's products.

### Categories

Restaurant owners must be able to:

- create categories
- rename categories
- add products to categories
- create new categories without changing template code

The template must render categories dynamically from the existing data source.

### Ordering

Customers must be able to:

- browse products
- open product details when supported
- add products to cart
- change quantities
- remove products
- choose the supported order fulfillment method
- continue through the existing checkout flow

Supported fulfillment methods may include:

- delivery
- takeaway
- dine-in / table

Do not create a separate ordering system inside the template.

### Dashboard Integration

Orders created through the template MUST use the existing backend/order system.

Orders must appear in the restaurant owner's existing dashboard.

Do not create template-specific order storage.

### Dynamic Data

Never hardcode:

- restaurant name
- categories
- products
- prices
- availability
- order data

The template must consume the existing dynamic data.

### Business Logic

Do not duplicate or replace:

- authentication
- cart logic
- checkout
- payment logic
- order creation
- branch logic
- restaurant dashboard logic

Reuse the existing application functionality.