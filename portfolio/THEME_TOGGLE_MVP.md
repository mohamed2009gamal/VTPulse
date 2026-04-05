# Light/Dark Theme Toggle (MVP)

In **MVP terms for a professional portfolio website**, the Theme Toggle consists of **two selectable items** that represent the available interface themes. Each item has two possible states: **Active** and **Inactive**.

---

## 1. Light Theme Item

### Active State (Selected)

When the **Light theme is active**:

* The **Light option** appears visually highlighted.
* It has a **white background** inside the toggle container.
* The text **“Light”** appears darker and more prominent.
* This indicates that the **portfolio interface is currently using the Light theme**.
* The rest of the website uses:

  * Light background colors
  * Dark text
  * Bright UI elements.

### Inactive State (Not Selected)

When the **Light theme is inactive**:

* The **Light option** appears flat or neutral.
* It sits on the **gray toggle background** without a highlight.
* The text appears **less emphasized**.
* Clicking it will **activate the Light theme and deactivate Dark mode**.

---

## 2. Dark Theme Item

### Active State (Selected)

When the **Dark theme is active**:

* The **Dark option** becomes the highlighted segment.
* It receives the **white (or highlighted) background inside the toggle**.
* The text **“Dark”** becomes visually emphasized.
* This indicates that the **portfolio interface is currently using Dark mode**.
* The website changes to:

  * Dark backgrounds
  * Light text
  * Reduced brightness for comfortable viewing.

### Inactive State (Not Selected)

When the **Dark theme is inactive**:

* The **Dark option** appears neutral on the gray background.
* It has **no highlight or emphasis**.
* The text appears **secondary compared to the active item**.
* Clicking it will **activate Dark mode and deactivate Light mode**.

---

## 3. Interaction Logic (MVP Behavior)

* Only **one item can be active at a time**.
* Clicking an **inactive item**:

  * Activates that theme.
  * Automatically **deactivates the other theme**.
* The **visual highlight moves to the selected option** to reflect the current theme.

---

## 4. MVP Design Principle

The toggle follows these **minimal product rules**:

* **Clear state indication** (active vs inactive).
* **Simple interaction** (single click switch).
* **Immediate visual feedback**.
* **No advanced customization** beyond Light and Dark themes.

This ensures the portfolio remains **clean, modern, and easy to use while keeping the implementation minimal.**

> This control should be available on **every page in the website** so that visitors can switch themes regardless of where they are browsing.

---

### Portfolio Website Theme Behavior (MVP Description)

In **MVP terms**, the portfolio website supports **two visual states: Light Mode and Dark Mode**. The appearance of the main interface elements changes depending on whether the theme toggle is **active or inactive**.

---

# 1. When Light Theme is Active

### Navigation Bar

* The **navigation bar background** is **transparent with a very light appearance**.
* It visually blends with the page while maintaining readability.
* A subtle shadow or blur may be used to keep the navigation visible over content.

### Logo Styling

The logo text **VENOMTECH** follows a fixed color structure:

* **VENOM** → colored **black**
* **TECH** → colored **dark blue**

This color scheme remains consistent across the entire website wherever the brand name appears.

### Navigation Menu Items

Navigation links use a **minimal professional color hierarchy**:

* Default items → **gray**
* Hover state → **black**
* Active page → **dark blue**

Example behavior:

| Item              | Color     |
| ----------------- | --------- |
| Default nav items | Gray      |
| Hovered item      | Black     |
| Active page item  | Dark Blue |

### Home Button Rule

* The **Home item** always appears **black** to emphasize the main entry point.
* When **Home is the active page**, its color changes to **dark blue**.

---

# 2. When Dark Theme is Active

### Navigation Bar

* The **navigation bar background** becomes **transparent but visually dark**.
* It blends with the dark interface using:

  * dark gray
  * near-black tones.

### Logo Styling

The **VENOMTECH logo color system remains consistent**:

* **VENOM** → lightened black or soft white for visibility
* **TECH** → **dark blue accent**

This preserves brand identity across both themes.

### Navigation Menu Items

Navigation items adapt for readability:

| Item              | Color      |
| ----------------- | ---------- |
| Default nav items | Light gray |
| Hovered item      | White      |
| Active page item  | Dark blue  |

### Home Button Rule

* **Home** remains slightly emphasized compared to other items.
* Default → **light gray or white**
* Active → **dark blue**

---

# 3. Active Navigation Item Behavior

Across both themes:

* Only **one navigation item is active at a time**.
* The **active item color is always dark blue**.
* This provides a **clear visual indicator of the current page**.

---

# 4. MVP Design Principles Applied

This design follows key **MVP principles**:

* **Consistent branding** using the VENOMTECH color identity.
* **Clear navigation state** through color hierarchy.
* **Minimal complexity** while maintaining professional design.
* **Theme compatibility** without requiring additional customization.

---

>If you want, I can also write the **full MVP UI specification for your entire portfolio (Navbar, Hero, Skills, Projects, Blog, Contact)** like a **real product design document**, which would make your portfolio look **very professional if you present it or document it.**