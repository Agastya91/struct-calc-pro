# StructCalc Pro 🏗️

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38bdf8?logo=tailwindcss&logoColor=white)

**StructCalc Pro** is a modern, professional-grade structural analysis application designed for engineers and students. It performs real-time static analysis of beam configurations, generating shear/moment diagrams, calculating reactions, and verifying design safety factors against material limits.

## 🌟 Key Features

### 📐 Advanced Analysis Engine
*   **Beam Support Types:**
    *   **Simply Supported:** Pin and Roller setup.
    *   **Cantilever:** Fixed support at one end.
    *   **Fixed-Fixed:** Indeterminate beam analysis using Fixed End Moment superposition.
*   **Load Configurations:**
    *   Point Loads (Concentrated force)
    *   Uniformly Distributed Loads (UDL)
    *   Triangular/Trapezoidal Distributed Loads
*   **Physics:** Solves for Support Reactions ($R_1, R_2, M_1$), Shear Force ($V$), Bending Moment ($M$), and Deflection estimation.

### 🛠️ Professional Configuration
*   **Material Library:** Includes standard engineering materials (Steel A36, Aluminum 6061, Titanium, Concrete, Carbon Fiber) with accurate Young's Modulus ($E$) and Yield Strength ($F_y$).
*   **Section Properties:** Auto-calculates Area ($A$), Moment of Inertia ($I$), and Centroid ($c$) for:
    *   Rectangles
    *   Circles & Hollow Circles
    *   I-Beams (Flange/Web logic)
*   **Unit Systems:** One-click toggle between **SI** (Metric) and **Imperial** units.

### 📊 Visualization & Safety
*   **Interactive Diagrams:** High-precision SVG plotting for Shear Force (SFD) and Bending Moment (BMD).
*   **Free Body Diagram (FBD):** Real-time visualization of the physical beam setup.
*   **Design Verification:** 
    *   Calculates Max Bending Stress ($\sigma = Mc/I$).
    *   Compares against Allowable Stress based on user-defined **Factor of Safety (FOS)**.
    *   Visual "Safe / Warning / Failure" indicators.

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18+)
*   npm

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/struct-calc-pro.git
    cd struct-calc-pro
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Run Development Server:**
    ```bash
    npm run dev
    ```

4.  **Open Browser:**
    Navigate to `http://localhost:5173` to see the app running.

## 🏗️ Architecture

This project is built with performance and type-safety in mind:

*   **Frontend Framework:** React 19 (Hooks, Functional Components)
*   **Language:** TypeScript (Strict typing for physics calculations)
*   **Styling:** Tailwind CSS (Responsive, utility-first)
*   **Icons:** Lucide React
*   **Build Tool:** Vite

## ⚠️ Disclaimer

**Educational Use Only.** While StructCalc Pro utilizes standard mechanics of materials formulas (statics equilibrium, singularity functions, and flexure formula), it is intended for educational purposes and preliminary sizing. Always verify critical structural designs with a licensed Professional Engineer (PE).

## 📄 License

This project is open source and available under the [MIT License](LICENSE).