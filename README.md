# Clinical Medication Calculator

A web-based medication calculation tool for healthcare professionals. Includes weight-based dosing, IV drip rate calculations, and drug dilution calculators.

## Features

### 1. Weight-Based Dosing Calculator
- Calculate doses based on patient weight (mg/kg, mcg/kg, units/kg)
- Supports kg and lb weight input
- Multiple frequency options (QD, BID, TID, QID, Q4H, Q3H)
- Shows single dose and daily total

### 2. IV Drip Rate Calculator
**Volume-Based Mode:**
- Calculate mL/hr flow rate from total volume and time
- Calculate drops/min with selectable drop factors (10, 15, 20, 60 gtt/mL)

**Dose-Based Mode:**
- Calculate flow rate from desired dose rate
- Supports mg/hr, mcg/hr, mcg/min, units/hr, mcg/kg/min
- Shows bag duration and concentration

### 3. Drug Dilution Calculator
**Target Concentration Mode:**
- Calculate stock volume and diluent needed for target concentration
- Uses C1V1 = C2V2 formula
- Supports mg/mL, mcg/mL, units/mL, and percentage

**Reconstitution Mode:**
- Calculate volume to draw from reconstituted medication
- Computes final concentration after reconstitution

## Deployment to GitHub Pages

### Option 1: Direct Upload
1. Create a new repository on GitHub
2. Upload all files (`index.html`, `styles.css`, `calculator.js`)
3. Go to **Settings** → **Pages**
4. Under "Source", select **Deploy from a branch**
5. Choose **main** branch and **/ (root)** folder
6. Click **Save**
7. Your site will be available at `https://yourusername.github.io/repository-name`

### Option 2: Using Git
```bash
# Navigate to the project folder
cd med-calculator

# Initialize git repository
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Clinical Medication Calculator"

# Add your GitHub repository as remote
git remote add origin https://github.com/yourusername/med-calculator.git

# Push to GitHub
git push -u origin main
```
Then enable GitHub Pages in repository settings.

## Project Structure

```
med-calculator/
├── index.html      # Main HTML structure
├── styles.css      # All styling (responsive, accessible)
├── calculator.js   # Calculation logic and interactivity
└── README.md       # This file
```

## Safety Features

- Input validation with clear error messages
- Medical disclaimer prominently displayed
- Print-friendly results
- High contrast mode support
- Keyboard accessible (Tab navigation, Enter to calculate)

## Browser Support

- Chrome, Firefox, Safari, Edge (latest versions)
- Mobile responsive design
- Works offline after initial load

## Disclaimer

This tool is for **reference and educational purposes only**. Always:
- Verify calculations independently
- Follow institutional protocols
- Consult with pharmacists for complex calculations
- Use clinical judgment

---

*Version 1.0*
