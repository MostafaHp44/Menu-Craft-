---
name: Template Testing
description: Validate Digital Menu templates for responsive behavior, ordering flows, RTL, accessibility and regressions.
---

# Digital Menu Template QA

Before declaring a template complete, verify the template against the existing Digital Menu system.

## Visual

Check:

- desktop
- tablet
- mobile
- small mobile screens

## Content

Test:

- short restaurant name
- very long restaurant name
- short product name
- long product name
- long product description
- missing image
- many products
- few products
- empty category

## Localization

Verify:

- English
- Arabic
- RTL
- mixed content when applicable

## Menu

Verify:

- category navigation
- product display
- product details
- prices
- availability
- badges
- add to cart

## Cart

Verify:

- add product
- increase quantity
- decrease quantity
- remove product
- cart totals
- empty cart
- cart animation

## Checkout

Verify the existing checkout flow works.

Do not replace the project's checkout implementation.

## Branches

If the existing system requires branch selection:

- branch selection works
- selected branch persists according to existing behavior
- cart/order uses the correct branch

## Animation

Verify:

- animations do not block interaction
- animations are smooth
- reduced-motion considerations
- no excessive animation
- no layout jumping

## Technical

Check:

- no console errors
- no broken imports
- no broken images
- no missing components
- no unnecessary API requests
- no obvious performance issues

## Regression

Confirm:

- existing templates still work
- aurum is untouched
- basta is untouched
- caffe-brew is untouched
- dabba is untouched

## Final Rule

Do not declare the template finished until the complete customer journey has been checked:

Landing
→ Browse
→ Product
→ Cart
→ Checkout
→ Order