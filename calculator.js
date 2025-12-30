/**
 * Clinical Medication Calculator
 * JavaScript calculations for medication dosing, IV rates, and dilutions
 */

// Tab Navigation
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Show corresponding section
        const tabId = btn.dataset.tab;
        document.querySelectorAll('.calculator-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(tabId).classList.add('active');
    });
});

// Mode Toggle for Drip Rate Calculator
document.querySelectorAll('#drip-rate .mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('#drip-rate .mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const mode = btn.dataset.mode;
        document.getElementById('volume-mode').classList.toggle('active', mode === 'volume');
        document.getElementById('dose-mode').classList.toggle('active', mode === 'dose');

        // Hide results when switching modes
        document.getElementById('drip-rate-result').classList.add('hidden');
    });
});

// Mode Toggle for Dilution Calculator
document.querySelectorAll('#dilution .mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('#dilution .mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const mode = btn.dataset.mode;
        document.getElementById('target-conc-mode').classList.toggle('active', mode === 'target-conc');
        document.getElementById('reconstitution-mode').classList.toggle('active', mode === 'reconstitution');

        // Hide results when switching modes
        document.getElementById('dilution-result').classList.add('hidden');
    });
});

// Show/hide patient weight field for mcg/kg/min dosing (legacy - for non-dual-column mode)
const desiredDoseUnit = document.getElementById('desired-dose-unit');
if (desiredDoseUnit) {
    desiredDoseUnit.addEventListener('change', function() {
        const weightGroup = document.getElementById('dose-weight-group');
        if (weightGroup) {
            weightGroup.style.display = this.value === 'mcg/kg/min' ? 'block' : 'none';
        }
    });
}

// ==========================================
// Weight-Based Dosing Calculator
// ==========================================
function calculateWeightDose() {
    const weight = parseFloat(document.getElementById('patient-weight').value);
    const weightUnit = document.getElementById('weight-unit').value;
    const dosePerKg = parseFloat(document.getElementById('dose-per-kg').value);
    const doseUnit = document.getElementById('dose-unit').value;
    const frequency = parseInt(document.getElementById('frequency').value);

    const resultBox = document.getElementById('weight-dose-result');

    // Validation
    if (isNaN(weight) || weight <= 0) {
        showError(resultBox, 'Please enter a valid patient weight');
        return;
    }
    if (isNaN(dosePerKg) || dosePerKg <= 0) {
        showError(resultBox, 'Please enter a valid dose per kg');
        return;
    }

    // Convert weight to kg if needed
    let weightInKg = weight;
    if (weightUnit === 'lb') {
        weightInKg = weight * 0.453592;
    }

    // Calculate doses
    const singleDose = weightInKg * dosePerKg;
    const dailyDose = singleDose * frequency;

    // Display results
    resultBox.classList.remove('hidden', 'error');
    document.getElementById('single-dose').textContent = formatNumber(singleDose) + ' ' + doseUnit.replace('/kg', '');
    document.getElementById('daily-dose').textContent = formatNumber(dailyDose) + ' ' + doseUnit.replace('/kg', '') + '/day';
    document.getElementById('weight-used').textContent = formatNumber(weightInKg) + ' kg';
}

// ==========================================
// IV Drip Rate Calculator (Volume-Based)
// ==========================================
function calculateDripRate() {
    const totalVolume = parseFloat(document.getElementById('total-volume').value);
    const infusionTime = parseFloat(document.getElementById('infusion-time').value);
    const timeUnit = document.getElementById('time-unit').value;
    const dropFactor = parseInt(document.getElementById('drop-factor').value);

    const resultBox = document.getElementById('drip-rate-result');

    // Validation
    if (isNaN(totalVolume) || totalVolume <= 0) {
        showError(resultBox, 'Please enter a valid volume');
        return;
    }
    if (isNaN(infusionTime) || infusionTime <= 0) {
        showError(resultBox, 'Please enter a valid infusion time');
        return;
    }

    // Convert time to hours
    let timeInHours = infusionTime;
    if (timeUnit === 'min') {
        timeInHours = infusionTime / 60;
    }

    // Calculate flow rate (mL/hr)
    const flowRate = totalVolume / timeInHours;

    // Calculate drop rate (gtt/min)
    const dropRate = (totalVolume * dropFactor) / (timeInHours * 60);

    // Display results
    resultBox.classList.remove('hidden', 'error');
    document.getElementById('flow-rate').textContent = formatNumber(flowRate) + ' mL/hr';
    document.getElementById('drop-rate').textContent = Math.round(dropRate) + ' gtt/min';
    document.getElementById('duration').textContent = formatTime(timeInHours);

    // Show/hide appropriate fields
    document.getElementById('drops-result').style.display = 'flex';
    document.getElementById('duration-result').style.display = 'flex';
    document.getElementById('concentration-result').style.display = 'none';
}

// ==========================================
// IV Drip Rate Calculator (Dose-Based)
// ==========================================
function calculateDoseBasedRate() {
    const drugAmount = parseFloat(document.getElementById('drug-amount').value);
    const drugAmountUnit = document.getElementById('drug-amount-unit').value;
    const bagVolume = parseFloat(document.getElementById('bag-volume').value);
    const desiredDose = parseFloat(document.getElementById('desired-dose').value);
    const desiredDoseUnit = document.getElementById('desired-dose-unit').value;

    const resultBox = document.getElementById('drip-rate-result');

    // Validation
    if (isNaN(drugAmount) || drugAmount <= 0) {
        showError(resultBox, 'Please enter a valid drug amount');
        return;
    }
    if (isNaN(bagVolume) || bagVolume <= 0) {
        showError(resultBox, 'Please enter a valid bag volume');
        return;
    }
    if (isNaN(desiredDose) || desiredDose <= 0) {
        showError(resultBox, 'Please enter a valid desired dose');
        return;
    }

    // Convert drug amount to base unit (mcg for mcg-based, mg for mg-based)
    let drugAmountConverted = drugAmount;
    if (drugAmountUnit === 'mg' && (desiredDoseUnit.includes('mcg'))) {
        drugAmountConverted = drugAmount * 1000; // mg to mcg
    } else if (drugAmountUnit === 'mcg' && desiredDoseUnit.includes('mg')) {
        drugAmountConverted = drugAmount / 1000; // mcg to mg
    }

    // Calculate concentration
    const concentration = drugAmountConverted / bagVolume;

    // Calculate flow rate based on desired dose unit
    let flowRate;
    let dosePerHour = desiredDose;

    if (desiredDoseUnit === 'mcg/min') {
        dosePerHour = desiredDose * 60;
    } else if (desiredDoseUnit === 'mcg/kg/min') {
        const patientWeight = parseFloat(document.getElementById('dose-patient-weight').value);
        if (isNaN(patientWeight) || patientWeight <= 0) {
            showError(resultBox, 'Please enter patient weight for mcg/kg/min calculations');
            return;
        }
        dosePerHour = desiredDose * patientWeight * 60;
    }

    flowRate = dosePerHour / concentration;

    // Calculate how long the bag will last
    const duration = bagVolume / flowRate;

    // Display results
    resultBox.classList.remove('hidden', 'error');
    document.getElementById('flow-rate').textContent = formatNumber(flowRate) + ' mL/hr';

    // Show concentration
    let concUnit = drugAmountUnit + '/mL';
    if (drugAmountUnit === 'mg' && desiredDoseUnit.includes('mcg')) {
        concUnit = 'mcg/mL';
    }
    document.getElementById('concentration').textContent = formatNumber(concentration) + ' ' + concUnit;
    document.getElementById('concentration-result').style.display = 'flex';

    document.getElementById('duration').textContent = formatTime(duration);
    document.getElementById('duration-result').style.display = 'flex';

    document.getElementById('drops-result').style.display = 'none';
}

// ==========================================
// Dilution Calculator (Target Concentration)
// ==========================================
function calculateDilution() {
    const stockConc = parseFloat(document.getElementById('stock-conc').value);
    const stockConcUnit = document.getElementById('stock-conc-unit').value;
    const targetConc = parseFloat(document.getElementById('target-conc').value);
    const targetConcUnit = document.getElementById('target-conc-unit').value;
    const finalVolume = parseFloat(document.getElementById('final-volume').value);

    const resultBox = document.getElementById('dilution-result');

    // Validation
    if (isNaN(stockConc) || stockConc <= 0) {
        showError(resultBox, 'Please enter a valid stock concentration');
        return;
    }
    if (isNaN(targetConc) || targetConc <= 0) {
        showError(resultBox, 'Please enter a valid target concentration');
        return;
    }
    if (isNaN(finalVolume) || finalVolume <= 0) {
        showError(resultBox, 'Please enter a valid final volume');
        return;
    }

    // Convert concentrations to same unit
    let stockConverted = stockConc;
    let targetConverted = targetConc;

    // Handle percentage conversion (1% = 10 mg/mL)
    if (stockConcUnit === '%') {
        stockConverted = stockConc * 10; // Convert to mg/mL
    }
    if (targetConcUnit === '%') {
        targetConverted = targetConc * 10; // Convert to mg/mL
    }

    // Handle mcg/mL conversions
    if (stockConcUnit === 'mcg/mL' && targetConcUnit === 'mg/mL') {
        stockConverted = stockConc / 1000;
    } else if (stockConcUnit === 'mg/mL' && targetConcUnit === 'mcg/mL') {
        targetConverted = targetConc / 1000;
    }

    // Check if dilution is possible
    if (targetConverted >= stockConverted) {
        showError(resultBox, 'Target concentration must be less than stock concentration');
        return;
    }

    // C1V1 = C2V2 formula
    // stockConc * stockVol = targetConc * finalVol
    const stockVolume = (targetConverted * finalVolume) / stockConverted;
    const diluentVolume = finalVolume - stockVolume;

    // Display results
    resultBox.classList.remove('hidden', 'error');
    document.getElementById('stock-volume').textContent = formatNumber(stockVolume) + ' mL';
    document.getElementById('diluent-add').textContent = formatNumber(diluentVolume) + ' mL';
    document.getElementById('final-conc').textContent = formatNumber(targetConc) + ' ' + targetConcUnit;

    // Show appropriate fields
    document.getElementById('stock-vol-result').style.display = 'flex';
    document.getElementById('diluent-vol-result').style.display = 'flex';
    document.getElementById('final-conc-result').style.display = 'flex';
    document.getElementById('volume-draw-result').style.display = 'none';
}

// ==========================================
// Reconstitution Calculator
// ==========================================
function calculateReconstitution() {
    const powderAmount = parseFloat(document.getElementById('powder-amount').value);
    const powderUnit = document.getElementById('powder-unit').value;
    const diluentVolume = parseFloat(document.getElementById('diluent-volume').value);
    const desiredDose = parseFloat(document.getElementById('desired-dose-recon').value);
    const desiredDoseUnit = document.getElementById('desired-dose-recon-unit').value;

    const resultBox = document.getElementById('dilution-result');

    // Validation
    if (isNaN(powderAmount) || powderAmount <= 0) {
        showError(resultBox, 'Please enter a valid powder amount');
        return;
    }
    if (isNaN(diluentVolume) || diluentVolume <= 0) {
        showError(resultBox, 'Please enter a valid diluent volume');
        return;
    }
    if (isNaN(desiredDose) || desiredDose <= 0) {
        showError(resultBox, 'Please enter a valid desired dose');
        return;
    }

    // Convert units if needed
    let powderConverted = powderAmount;
    let desiredConverted = desiredDose;

    // Convert g to mg
    if (powderUnit === 'g') {
        powderConverted = powderAmount * 1000;
    } else if (powderUnit === 'mcg') {
        powderConverted = powderAmount / 1000;
    }

    if (desiredDoseUnit === 'g') {
        desiredConverted = desiredDose * 1000;
    } else if (desiredDoseUnit === 'mcg') {
        desiredConverted = desiredDose / 1000;
    }

    // Calculate final concentration after reconstitution
    const finalConcentration = powderConverted / diluentVolume;

    // Calculate volume to draw
    const volumeToDraw = desiredConverted / finalConcentration;

    // Check if dose is achievable
    if (volumeToDraw > diluentVolume) {
        showError(resultBox, 'Desired dose exceeds available drug. Maximum dose: ' + formatNumber(powderConverted) + ' mg');
        return;
    }

    // Display results
    resultBox.classList.remove('hidden', 'error');

    // Determine display unit
    let concUnit = 'mg/mL';
    if (powderUnit === 'mcg' && desiredDoseUnit === 'mcg') {
        concUnit = 'mcg/mL';
    } else if (powderUnit === 'units') {
        concUnit = 'units/mL';
    }

    document.getElementById('final-conc').textContent = formatNumber(finalConcentration) + ' ' + concUnit;
    document.getElementById('volume-draw').textContent = formatNumber(volumeToDraw) + ' mL';

    // Show appropriate fields
    document.getElementById('stock-vol-result').style.display = 'none';
    document.getElementById('diluent-vol-result').style.display = 'none';
    document.getElementById('final-conc-result').style.display = 'flex';
    document.getElementById('volume-draw-result').style.display = 'flex';
}

// ==========================================
// Utility Functions
// ==========================================

function showError(resultBox, message) {
    resultBox.classList.remove('hidden');
    resultBox.classList.add('error');
    resultBox.innerHTML = `
        <h3>Error</h3>
        <div class="result-item">
            <span class="label" style="color: var(--danger-color);">${message}</span>
        </div>
    `;
}

function formatNumber(num) {
    if (num >= 1000) {
        return num.toLocaleString('en-US', { maximumFractionDigits: 1 });
    } else if (num >= 1) {
        return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
    } else if (num >= 0.01) {
        return num.toLocaleString('en-US', { maximumFractionDigits: 3 });
    } else {
        return num.toLocaleString('en-US', { maximumFractionDigits: 4 });
    }
}

function formatTime(hours) {
    if (hours < 1) {
        return Math.round(hours * 60) + ' min';
    } else if (hours < 24) {
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        if (m === 0) {
            return h + ' hr';
        }
        return h + ' hr ' + m + ' min';
    } else {
        const d = Math.floor(hours / 24);
        const h = Math.round(hours % 24);
        if (h === 0) {
            return d + ' day' + (d > 1 ? 's' : '');
        }
        return d + ' day' + (d > 1 ? 's' : '') + ' ' + h + ' hr';
    }
}

// Enter key support for inputs
document.querySelectorAll('input[type="number"]').forEach(input => {
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            // Find the calculate button in the same section
            const section = this.closest('.calculator-section');
            const activeMode = section.querySelector('.mode-content.active');
            const btn = (activeMode || section).querySelector('.calculate-btn');
            if (btn) {
                btn.click();
            }
        }
    });
});

// ==========================================
// Antibiotic Database
// ==========================================
const antibioticDatabase = {
    'iv-common': {
        'vancomycin': {
            name: 'Vancomycin',
            route: 'IV',
            adult: { dose: 15, unit: 'mg/kg', frequency: 'Q12H', maxDaily: 4000 },
            pediatric: { dose: 15, unit: 'mg/kg', frequency: 'Q6H', maxDaily: 2000 },
            neonate: { dose: 15, unit: 'mg/kg', frequency: 'Q8-12H', maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: 'Q12H', note: 'Standard dose Q12H' },
                moderate: { adjust: 'Q24H', note: 'Standard dose Q24H' },
                severe: { adjust: 'Q48H', note: 'Standard dose Q48H, monitor levels' },
                esrd: { adjust: 'Load then PRN', note: '15-20 mg/kg load, redose when trough <15-20' }
            },
            notes: 'Monitor trough levels. Target trough 15-20 mcg/mL for serious infections.',
            warnings: ['Nephrotoxic', 'Red man syndrome with rapid infusion', 'Monitor levels'],
            reference: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7462027/'
        },
        'piperacillin-tazobactam': {
            name: 'Piperacillin-Tazobactam (Zosyn)',
            route: 'IV',
            adult: { dose: 3.375, unit: 'g', frequency: 'Q6H', maxDaily: 18, fixedDose: true },
            pediatric: { dose: 100, unit: 'mg/kg', frequency: 'Q6-8H', maxDaily: 16000 },
            neonate: { dose: 75, unit: 'mg/kg', frequency: 'Q8H', maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: 'No change', note: 'Standard dosing' },
                moderate: { adjust: '2.25g Q6H', note: 'Reduced dose' },
                severe: { adjust: '2.25g Q8H', note: 'Reduced dose and interval' },
                esrd: { adjust: '2.25g Q12H', note: 'Post-HD dosing' }
            },
            notes: 'Extended infusion (4hr) may improve outcomes for serious infections.',
            warnings: ['Contains sodium', 'May cause hypokalemia'],
            reference: 'https://www.ncbi.nlm.nih.gov/books/NBK551665/'
        },
        'ceftriaxone': {
            name: 'Ceftriaxone (Rocephin)',
            route: 'IV/IM',
            adult: { dose: 1, unit: 'g', frequency: 'Q24H', maxDaily: 4, fixedDose: true },
            pediatric: { dose: 50, unit: 'mg/kg', frequency: 'Q24H', maxDaily: 2000 },
            neonate: { dose: 50, unit: 'mg/kg', frequency: 'Q24H', maxDaily: null },
            renalAdjust: false,
            notes: 'Meningitis: 2g Q12H (adult) or 100 mg/kg/day divided Q12H (peds).',
            warnings: ['Avoid in neonates with hyperbilirubinemia', 'Do not mix with calcium'],
            reference: 'https://www.ncbi.nlm.nih.gov/books/NBK555892/'
        },
        'meropenem': {
            name: 'Meropenem (Merrem)',
            route: 'IV',
            adult: { dose: 1, unit: 'g', frequency: 'Q8H', maxDaily: 6, fixedDose: true },
            pediatric: { dose: 20, unit: 'mg/kg', frequency: 'Q8H', maxDaily: 2000 },
            neonate: { dose: 20, unit: 'mg/kg', frequency: 'Q8-12H', maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: 'No change', note: 'Standard dosing' },
                moderate: { adjust: '1g Q12H', note: 'Reduced frequency' },
                severe: { adjust: '500mg Q12H', note: 'Reduced dose and frequency' },
                esrd: { adjust: '500mg Q24H', note: 'Post-HD dosing recommended' }
            },
            notes: 'Meningitis dosing: 2g Q8H. Extended infusion may benefit severe infections.',
            warnings: ['May lower seizure threshold', 'Avoid with valproic acid'],
            reference: 'https://www.ncbi.nlm.nih.gov/books/NBK557755/'
        },
        'cefepime': {
            name: 'Cefepime (Maxipime)',
            route: 'IV',
            adult: { dose: 2, unit: 'g', frequency: 'Q8H', maxDaily: 6, fixedDose: true },
            pediatric: { dose: 50, unit: 'mg/kg', frequency: 'Q8H', maxDaily: 2000 },
            neonate: { dose: 30, unit: 'mg/kg', frequency: 'Q12H', maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: '2g Q12H', note: 'Reduced frequency' },
                moderate: { adjust: '2g Q24H', note: 'Once daily dosing' },
                severe: { adjust: '1g Q24H', note: 'Reduced dose' },
                esrd: { adjust: '1g Q24H', note: 'Give after HD' }
            },
            notes: 'Pseudomonal coverage. Good CNS penetration.',
            warnings: ['Neurotoxicity risk in renal impairment', 'Monitor for encephalopathy'],
            reference: 'https://www.ncbi.nlm.nih.gov/books/NBK557755/'
        },
        'cefazolin': {
            name: 'Cefazolin (Ancef)',
            route: 'IV',
            adult: { dose: 2, unit: 'g', frequency: 'Q8H', maxDaily: 12, fixedDose: true },
            pediatric: { dose: 25, unit: 'mg/kg', frequency: 'Q8H', maxDaily: 6000 },
            neonate: { dose: 25, unit: 'mg/kg', frequency: 'Q12H', maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: 'No change', note: 'Standard dosing' },
                moderate: { adjust: '1-2g Q12H', note: 'Reduced frequency' },
                severe: { adjust: '1-2g Q24H', note: 'Once daily dosing' },
                esrd: { adjust: '1-2g Q48-72H', note: 'Post-HD dosing' }
            },
            notes: 'First-line for skin/soft tissue, surgical prophylaxis.',
            warnings: ['Cross-reactivity with penicillin allergy (1-2%)'],
            reference: 'https://www.ncbi.nlm.nih.gov/books/NBK551653/'
        },
        'ampicillin-sulbactam': {
            name: 'Ampicillin-Sulbactam (Unasyn)',
            route: 'IV',
            adult: { dose: 3, unit: 'g', frequency: 'Q6H', maxDaily: 12, fixedDose: true },
            pediatric: { dose: 50, unit: 'mg/kg', frequency: 'Q6H', maxDaily: 8000 },
            neonate: { dose: 50, unit: 'mg/kg', frequency: 'Q8-12H', maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: 'No change', note: 'Standard dosing' },
                moderate: { adjust: '1.5-3g Q12H', note: 'Reduced frequency' },
                severe: { adjust: '1.5-3g Q24H', note: 'Once daily dosing' },
                esrd: { adjust: '1.5-3g Q24H', note: 'Post-HD dosing' }
            },
            notes: 'Good for intra-abdominal, gynecologic infections.',
            warnings: ['Penicillin allergy', 'May cause rash'],
            reference: 'https://www.ncbi.nlm.nih.gov/books/NBK545280/'
        },
        'metronidazole': {
            name: 'Metronidazole (Flagyl)',
            route: 'IV/PO',
            adult: { dose: 500, unit: 'mg', frequency: 'Q8H', maxDaily: 4000, fixedDose: true },
            pediatric: { dose: 7.5, unit: 'mg/kg', frequency: 'Q6H', maxDaily: 4000 },
            neonate: { dose: 7.5, unit: 'mg/kg', frequency: 'Q12-24H', maxDaily: null },
            renalAdjust: false,
            notes: 'Anaerobic coverage. C. diff: 500mg PO TID x 10-14 days.',
            warnings: ['Disulfiram reaction with alcohol', 'Metallic taste', 'Peripheral neuropathy with prolonged use'],
            reference: 'https://www.ncbi.nlm.nih.gov/books/NBK539793/'
        },
        'aztreonam': {
            name: 'Aztreonam (Azactam)',
            route: 'IV',
            adult: { dose: 2, unit: 'g', frequency: 'Q8H', maxDaily: 8, fixedDose: true },
            pediatric: { dose: 30, unit: 'mg/kg', frequency: 'Q6-8H', maxDaily: 8000 },
            neonate: { dose: 30, unit: 'mg/kg', frequency: 'Q8-12H', maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: 'No change', note: 'Standard dosing' },
                moderate: { adjust: '1-2g Q12H', note: 'Reduced frequency' },
                severe: { adjust: '500mg-1g Q12H', note: 'Reduced dose' },
                esrd: { adjust: '500mg Q12H', note: 'Post-HD dosing' }
            },
            notes: 'Safe in penicillin/cephalosporin allergy. Gram-negative only.',
            warnings: ['No gram-positive coverage', 'No anaerobic coverage'],
            reference: 'https://www.ncbi.nlm.nih.gov/books/NBK547696/'
        },
        'ciprofloxacin-iv': {
            name: 'Ciprofloxacin IV',
            route: 'IV',
            adult: { dose: 400, unit: 'mg', frequency: 'Q12H', maxDaily: 1200, fixedDose: true },
            pediatric: { dose: 10, unit: 'mg/kg', frequency: 'Q12H', maxDaily: 800 },
            neonate: { dose: null, unit: null, frequency: null, maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: 'No change', note: 'Standard dosing' },
                moderate: { adjust: '400mg Q12H', note: 'Standard dosing' },
                severe: { adjust: '400mg Q24H', note: 'Reduced frequency' },
                esrd: { adjust: '400mg Q24H', note: 'Post-HD dosing' }
            },
            notes: 'Good for UTI, respiratory, GI infections. Antipseudomonal.',
            warnings: ['Tendon rupture risk', 'QT prolongation', 'Avoid in children if possible'],
            reference: 'https://www.ncbi.nlm.nih.gov/books/NBK535454/'
        },
        'levofloxacin-iv': {
            name: 'Levofloxacin IV',
            route: 'IV',
            adult: { dose: 750, unit: 'mg', frequency: 'Q24H', maxDaily: 750, fixedDose: true },
            pediatric: { dose: 10, unit: 'mg/kg', frequency: 'Q12-24H', maxDaily: 750 },
            neonate: { dose: null, unit: null, frequency: null, maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: '750mg Q48H', note: 'Reduced frequency' },
                moderate: { adjust: '750mg Q48H', note: 'Every other day' },
                severe: { adjust: '500mg Q48H', note: 'Reduced dose and frequency' },
                esrd: { adjust: '500mg Q48H', note: 'Post-HD if applicable' }
            },
            notes: 'Respiratory fluoroquinolone. CAP, UTI, skin infections.',
            warnings: ['Tendon rupture risk', 'QT prolongation', 'CNS effects'],
            reference: 'https://www.ncbi.nlm.nih.gov/books/NBK546023/'
        }
    },
    'aminoglycosides': {
        'gentamicin': {
            name: 'Gentamicin',
            route: 'IV',
            adult: { dose: 5, unit: 'mg/kg', frequency: 'Q24H (extended)', maxDaily: null },
            pediatric: { dose: 2.5, unit: 'mg/kg', frequency: 'Q8H', maxDaily: null },
            neonate: { dose: 4, unit: 'mg/kg', frequency: 'Q24-48H', maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: 'Q36H', note: 'Extended interval' },
                moderate: { adjust: 'Q48H', note: 'Extended interval, monitor levels' },
                severe: { adjust: 'Per levels', note: 'Dose based on levels' },
                esrd: { adjust: 'Per levels', note: 'Load 2mg/kg, redose per levels' }
            },
            notes: 'Traditional: 1-1.7 mg/kg Q8H. Extended interval preferred for most indications.',
            warnings: ['Nephrotoxic', 'Ototoxic', 'Monitor peak/trough levels', 'Avoid with other nephrotoxins'],
            reference: 'https://www.ncbi.nlm.nih.gov/books/NBK557550/'
        },
        'tobramycin': {
            name: 'Tobramycin',
            route: 'IV',
            adult: { dose: 5, unit: 'mg/kg', frequency: 'Q24H (extended)', maxDaily: null },
            pediatric: { dose: 2.5, unit: 'mg/kg', frequency: 'Q8H', maxDaily: null },
            neonate: { dose: 4, unit: 'mg/kg', frequency: 'Q24-48H', maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: 'Q36H', note: 'Extended interval' },
                moderate: { adjust: 'Q48H', note: 'Extended interval' },
                severe: { adjust: 'Per levels', note: 'Dose based on levels' },
                esrd: { adjust: 'Per levels', note: 'Load then per levels' }
            },
            notes: 'Better Pseudomonal activity than gentamicin. Inhaled for CF.',
            warnings: ['Nephrotoxic', 'Ototoxic', 'Monitor levels'],
            reference: 'https://www.ncbi.nlm.nih.gov/books/NBK551695/'
        },
        'amikacin': {
            name: 'Amikacin',
            route: 'IV',
            adult: { dose: 15, unit: 'mg/kg', frequency: 'Q24H', maxDaily: 1500 },
            pediatric: { dose: 15, unit: 'mg/kg', frequency: 'Q24H', maxDaily: null },
            neonate: { dose: 15, unit: 'mg/kg', frequency: 'Q24-48H', maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: 'Q36H', note: 'Extended interval' },
                moderate: { adjust: 'Q48H', note: 'Extended interval' },
                severe: { adjust: 'Per levels', note: 'Dose based on levels' },
                esrd: { adjust: 'Per levels', note: '7.5mg/kg load, per levels' }
            },
            notes: 'Reserved for resistant organisms. Broader gram-negative activity.',
            warnings: ['Nephrotoxic', 'Ototoxic', 'Monitor peak (25-35) and trough (<5)'],
            reference: 'https://www.ncbi.nlm.nih.gov/books/NBK430908/'
        }
    },
    'pediatric': {
        'amoxicillin': {
            name: 'Amoxicillin',
            route: 'PO',
            adult: { dose: 500, unit: 'mg', frequency: 'Q8H', maxDaily: 3000, fixedDose: true },
            pediatric: { dose: 25, unit: 'mg/kg', frequency: 'Q8H', maxDaily: 3000 },
            neonate: { dose: 30, unit: 'mg/kg', frequency: 'Q12H', maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: 'No change', note: 'Standard dosing' },
                moderate: { adjust: 'Q12H', note: 'Extended interval' },
                severe: { adjust: 'Q24H', note: 'Once daily' },
                esrd: { adjust: 'Q24H', note: 'Dose after dialysis' }
            },
            notes: 'High-dose (80-90 mg/kg/day) for AOM with risk factors.',
            warnings: ['Rash common', 'Diarrhea'],
            reference: 'https://www.ncbi.nlm.nih.gov/books/NBK482250/'
        },
        'amoxicillin-clavulanate': {
            name: 'Amoxicillin-Clavulanate (Augmentin)',
            route: 'PO',
            adult: { dose: 875, unit: 'mg', frequency: 'Q12H', maxDaily: 1750, fixedDose: true },
            pediatric: { dose: 25, unit: 'mg/kg', frequency: 'Q12H', maxDaily: 1750 },
            neonate: { dose: 30, unit: 'mg/kg', frequency: 'Q12H', maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: 'No change', note: 'Standard dosing' },
                moderate: { adjust: '500mg Q12H', note: 'Reduced dose' },
                severe: { adjust: '500mg Q24H', note: 'Reduced frequency' },
                esrd: { adjust: '500mg Q24H', note: 'Post-dialysis' }
            },
            notes: 'High-dose: 90 mg/kg/day amoxicillin component. Use 14:1 ratio for AOM.',
            warnings: ['GI upset common', 'Take with food', 'Diarrhea'],
            reference: 'https://www.ncbi.nlm.nih.gov/books/NBK538164/'
        },
        'cephalexin': {
            name: 'Cephalexin (Keflex)',
            route: 'PO',
            adult: { dose: 500, unit: 'mg', frequency: 'Q6H', maxDaily: 4000, fixedDose: true },
            pediatric: { dose: 25, unit: 'mg/kg', frequency: 'Q6H', maxDaily: 4000 },
            neonate: { dose: 25, unit: 'mg/kg', frequency: 'Q8H', maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: 'No change', note: 'Standard dosing' },
                moderate: { adjust: '250-500mg Q8-12H', note: 'Reduced frequency' },
                severe: { adjust: '250mg Q12H', note: 'Reduced dose and frequency' },
                esrd: { adjust: '250mg Q12-24H', note: 'Post-dialysis' }
            },
            notes: 'First-line for skin/soft tissue infections. Strep pharyngitis.',
            warnings: ['Cross-reactivity with penicillin (1-2%)'],
            reference: 'https://www.ncbi.nlm.nih.gov/books/NBK549864/'
        },
        'azithromycin': {
            name: 'Azithromycin (Zithromax)',
            route: 'PO/IV',
            adult: { dose: 500, unit: 'mg', frequency: 'Day 1, then 250mg Q24H', maxDaily: 500, fixedDose: true },
            pediatric: { dose: 10, unit: 'mg/kg', frequency: 'Day 1, then 5 mg/kg Q24H', maxDaily: 500 },
            neonate: { dose: null, unit: null, frequency: null, maxDaily: null },
            renalAdjust: false,
            notes: 'Total course usually 5 days. CAP: 500mg x 3 days alternative.',
            warnings: ['QT prolongation', 'GI upset', 'Drug interactions'],
            reference: 'https://www.ncbi.nlm.nih.gov/books/NBK557766/'
        },
        'cefdinir': {
            name: 'Cefdinir (Omnicef)',
            route: 'PO',
            adult: { dose: 300, unit: 'mg', frequency: 'Q12H', maxDaily: 600, fixedDose: true },
            pediatric: { dose: 7, unit: 'mg/kg', frequency: 'Q12H', maxDaily: 600 },
            neonate: { dose: null, unit: null, frequency: null, maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: 'No change', note: 'Standard dosing' },
                moderate: { adjust: '300mg Q24H', note: 'Once daily' },
                severe: { adjust: '300mg Q24H', note: 'Once daily' },
                esrd: { adjust: '300mg post-HD', note: 'After dialysis' }
            },
            notes: 'Alternative for AOM, sinusitis, pharyngitis. Well tolerated.',
            warnings: ['May cause red stools (iron interaction)', 'Diarrhea'],
            reference: 'https://www.ncbi.nlm.nih.gov/books/NBK549881/'
        },
        'trimethoprim-sulfamethoxazole': {
            name: 'TMP-SMX (Bactrim)',
            route: 'PO/IV',
            adult: { dose: 160, unit: 'mg TMP', frequency: 'Q12H', maxDaily: 320, fixedDose: true },
            pediatric: { dose: 4, unit: 'mg/kg TMP', frequency: 'Q12H', maxDaily: 320 },
            neonate: { dose: null, unit: null, frequency: null, maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: 'No change', note: 'Standard dosing' },
                moderate: { adjust: '50% dose', note: 'Half dose' },
                severe: { adjust: 'Avoid', note: 'Not recommended' },
                esrd: { adjust: 'Avoid', note: 'Contraindicated' }
            },
            notes: 'UTI: 3-5 days. MRSA skin: 7-10 days. PCP prophylaxis available.',
            warnings: ['Hyperkalemia', 'Rash', 'Avoid in G6PD deficiency', 'Sulfa allergy'],
            reference: 'https://www.ncbi.nlm.nih.gov/books/NBK513232/'
        },
        'clindamycin': {
            name: 'Clindamycin (Cleocin)',
            route: 'PO/IV',
            adult: { dose: 300, unit: 'mg', frequency: 'Q8H (PO)', maxDaily: 1800, fixedDose: true },
            pediatric: { dose: 10, unit: 'mg/kg', frequency: 'Q8H', maxDaily: 1800 },
            neonate: { dose: 5, unit: 'mg/kg', frequency: 'Q8H', maxDaily: null },
            renalAdjust: false,
            notes: 'MRSA coverage. Good for skin, bone infections. IV: 600-900mg Q8H.',
            warnings: ['C. diff risk', 'GI upset common'],
            reference: 'https://www.ncbi.nlm.nih.gov/books/NBK519574/'
        }
    },
    'icu': {
        'vancomycin-loading': {
            name: 'Vancomycin (Loading Dose)',
            route: 'IV',
            adult: { dose: 25, unit: 'mg/kg', frequency: 'x1 load, then 15-20 mg/kg Q8-12H', maxDaily: 4000 },
            pediatric: { dose: 15, unit: 'mg/kg', frequency: 'Q6H', maxDaily: 2000 },
            neonate: { dose: 15, unit: 'mg/kg', frequency: 'Q8-12H', maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: 'Per levels', note: 'AUC-guided dosing' },
                moderate: { adjust: 'Per levels', note: 'AUC-guided dosing' },
                severe: { adjust: 'Per levels', note: 'AUC-guided dosing' },
                esrd: { adjust: 'Per levels', note: 'Load 20-25 mg/kg, then per levels' }
            },
            notes: 'Loading dose for severe infections. Target AUC/MIC 400-600.',
            warnings: ['Nephrotoxic', 'Red man syndrome', 'Monitor AUC or trough'],
            reference: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7462027/'
        },
        'meropenem-extended': {
            name: 'Meropenem (Extended Infusion)',
            route: 'IV',
            adult: { dose: 2, unit: 'g', frequency: 'Q8H over 3-4hr', maxDaily: 6, fixedDose: true },
            pediatric: { dose: 40, unit: 'mg/kg', frequency: 'Q8H', maxDaily: 6000 },
            neonate: { dose: 40, unit: 'mg/kg', frequency: 'Q8H', maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: '2g Q8H', note: 'Standard extended infusion' },
                moderate: { adjust: '1g Q8H', note: 'Extended infusion' },
                severe: { adjust: '1g Q12H', note: 'Reduced frequency' },
                esrd: { adjust: '500mg Q12H', note: 'Post-HD' }
            },
            notes: 'Extended infusion improves PK/PD for resistant organisms.',
            warnings: ['Seizure risk', 'Avoid valproic acid'],
            reference: 'https://www.ncbi.nlm.nih.gov/books/NBK557755/'
        },
        'daptomycin': {
            name: 'Daptomycin (Cubicin)',
            route: 'IV',
            adult: { dose: 6, unit: 'mg/kg', frequency: 'Q24H', maxDaily: null },
            pediatric: { dose: 6, unit: 'mg/kg', frequency: 'Q24H', maxDaily: null },
            neonate: { dose: null, unit: null, frequency: null, maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: 'Q24H', note: 'Standard dosing' },
                moderate: { adjust: 'Q48H', note: 'Extended interval' },
                severe: { adjust: 'Q48H', note: 'Extended interval' },
                esrd: { adjust: 'Q48H', note: 'After HD' }
            },
            notes: 'Bacteremia/endocarditis: 8-10 mg/kg. NOT for pneumonia.',
            warnings: ['CPK monitoring weekly', 'Avoid statins if possible', 'Inactivated by surfactant'],
            reference: 'https://www.ncbi.nlm.nih.gov/books/NBK470407/'
        },
        'linezolid': {
            name: 'Linezolid (Zyvox)',
            route: 'IV/PO',
            adult: { dose: 600, unit: 'mg', frequency: 'Q12H', maxDaily: 1200, fixedDose: true },
            pediatric: { dose: 10, unit: 'mg/kg', frequency: 'Q8H', maxDaily: 1200 },
            neonate: { dose: 10, unit: 'mg/kg', frequency: 'Q8H', maxDaily: null },
            renalAdjust: false,
            notes: 'MRSA pneumonia, VRE. 100% PO bioavailability.',
            warnings: ['Myelosuppression (monitor CBC)', 'Serotonin syndrome', 'MAO inhibitor', 'Limit to 2 weeks'],
            reference: 'https://www.ncbi.nlm.nih.gov/books/NBK539826/'
        },
        'ceftazidime-avibactam': {
            name: 'Ceftazidime-Avibactam (Avycaz)',
            route: 'IV',
            adult: { dose: 2.5, unit: 'g', frequency: 'Q8H over 2hr', maxDaily: 7.5, fixedDose: true },
            pediatric: { dose: 62.5, unit: 'mg/kg', frequency: 'Q8H', maxDaily: 7500 },
            neonate: { dose: null, unit: null, frequency: null, maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: '1.25g Q8H', note: 'Reduced dose' },
                moderate: { adjust: '0.94g Q12H', note: 'Reduced dose and frequency' },
                severe: { adjust: '0.94g Q24H', note: 'Once daily' },
                esrd: { adjust: '0.94g Q48H', note: 'After HD' }
            },
            notes: 'CRE, ESBL, MDR Pseudomonas. Reserve for resistant organisms.',
            warnings: ['Monitor for C. diff', 'Neurotoxicity in renal impairment'],
            reference: 'https://www.ncbi.nlm.nih.gov/books/NBK568723/'
        },
        'polymyxin-b': {
            name: 'Polymyxin B',
            route: 'IV',
            adult: { dose: 1.5, unit: 'mg/kg', frequency: 'Q12H (15000-25000 units/kg/day)', maxDaily: null },
            pediatric: { dose: 1.5, unit: 'mg/kg', frequency: 'Q12H', maxDaily: null },
            neonate: { dose: null, unit: null, frequency: null, maxDaily: null },
            renalAdjust: false,
            notes: 'Last-line for MDR gram-negatives. Not renally cleared.',
            warnings: ['Nephrotoxic', 'Neurotoxic', 'Monitor closely'],
            reference: 'https://www.ncbi.nlm.nih.gov/books/NBK557607/'
        },
        'colistin': {
            name: 'Colistin (Colistimethate)',
            route: 'IV',
            adult: { dose: 5, unit: 'mg/kg CBA', frequency: 'Loading, then 2.5mg/kg Q12H', maxDaily: null },
            pediatric: { dose: 2.5, unit: 'mg/kg', frequency: 'Q6-12H', maxDaily: null },
            neonate: { dose: null, unit: null, frequency: null, maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: 'Per nomogram', note: 'Consult pharmacy' },
                moderate: { adjust: 'Per nomogram', note: 'Consult pharmacy' },
                severe: { adjust: 'Per nomogram', note: 'Significant reduction' },
                esrd: { adjust: 'Per nomogram', note: 'HD removes drug' }
            },
            notes: 'CBA = colistin base activity. Loading dose critical. Use nomogram.',
            warnings: ['Nephrotoxic', 'Neurotoxic', 'Narrow therapeutic index'],
            reference: 'https://www.ncbi.nlm.nih.gov/books/NBK557607/'
        },
        'micafungin': {
            name: 'Micafungin (Mycamine)',
            route: 'IV',
            adult: { dose: 100, unit: 'mg', frequency: 'Q24H', maxDaily: 150, fixedDose: true },
            pediatric: { dose: 2, unit: 'mg/kg', frequency: 'Q24H', maxDaily: 100 },
            neonate: { dose: 4, unit: 'mg/kg', frequency: 'Q24H', maxDaily: null },
            renalAdjust: false,
            notes: 'Candidemia: 100mg. Esophageal candidiasis: 150mg.',
            warnings: ['Hepatotoxicity', 'Monitor LFTs'],
            reference: 'https://www.ncbi.nlm.nih.gov/books/NBK555970/'
        },
        'caspofungin': {
            name: 'Caspofungin (Cancidas)',
            route: 'IV',
            adult: { dose: 70, unit: 'mg', frequency: 'Day 1 load, then 50mg Q24H', maxDaily: 70, fixedDose: true },
            pediatric: { dose: 70, unit: 'mg/m²', frequency: 'Day 1, then 50 mg/m² Q24H', maxDaily: 70 },
            neonate: { dose: 25, unit: 'mg/m²', frequency: 'Q24H', maxDaily: null },
            renalAdjust: false,
            notes: 'Hepatic adjustment needed. Reduce maintenance to 35mg in moderate hepatic impairment.',
            warnings: ['Hepatotoxicity', 'Monitor LFTs', 'Drug interactions (cyclosporine)'],
            reference: 'https://www.ncbi.nlm.nih.gov/books/NBK557574/'
        },
        'fluconazole': {
            name: 'Fluconazole (Diflucan)',
            route: 'IV/PO',
            adult: { dose: 400, unit: 'mg', frequency: 'Q24H (load 800mg)', maxDaily: 800, fixedDose: true },
            pediatric: { dose: 6, unit: 'mg/kg', frequency: 'Q24H (load 12 mg/kg)', maxDaily: 400 },
            neonate: { dose: 12, unit: 'mg/kg', frequency: 'Q24H', maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: 'No change', note: 'Standard dosing' },
                moderate: { adjust: '50% dose', note: 'Half dose' },
                severe: { adjust: '50% dose', note: 'Half dose' },
                esrd: { adjust: '100% dose post-HD', note: 'Full dose after dialysis' }
            },
            notes: 'Candida sensitive species. 100% PO bioavailability.',
            warnings: ['Hepatotoxicity', 'QT prolongation', 'Drug interactions (CYP450)'],
            reference: 'https://www.ncbi.nlm.nih.gov/books/NBK534772/'
        }
    },
    'general': {
        'doxycycline': {
            name: 'Doxycycline',
            route: 'PO/IV',
            adult: { dose: 100, unit: 'mg', frequency: 'Q12H', maxDaily: 200, fixedDose: true },
            pediatric: { dose: 2.2, unit: 'mg/kg', frequency: 'Q12H', maxDaily: 200 },
            neonate: { dose: null, unit: null, frequency: null, maxDaily: null },
            renalAdjust: false,
            notes: 'CAP, skin infections, tick-borne illness. Take with food/water.',
            warnings: ['Photosensitivity', 'Avoid in pregnancy/children <8yr', 'Esophageal irritation'],
            reference: 'https://www.ncbi.nlm.nih.gov/books/NBK555888/'
        },
        'nitrofurantoin': {
            name: 'Nitrofurantoin (Macrobid)',
            route: 'PO',
            adult: { dose: 100, unit: 'mg', frequency: 'Q12H', maxDaily: 200, fixedDose: true },
            pediatric: { dose: 1.5, unit: 'mg/kg', frequency: 'Q6H', maxDaily: 400 },
            neonate: { dose: null, unit: null, frequency: null, maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: 'No change', note: 'Standard dosing' },
                moderate: { adjust: 'Avoid', note: 'Reduced efficacy' },
                severe: { adjust: 'Contraindicated', note: 'Ineffective' },
                esrd: { adjust: 'Contraindicated', note: 'Do not use' }
            },
            notes: 'Uncomplicated UTI only. 5-7 day course.',
            warnings: ['Avoid if CrCl <30', 'Pulmonary toxicity with long-term use', 'Take with food'],
            reference: 'https://www.ncbi.nlm.nih.gov/books/NBK470526/'
        },
        'ciprofloxacin-po': {
            name: 'Ciprofloxacin PO',
            route: 'PO',
            adult: { dose: 500, unit: 'mg', frequency: 'Q12H', maxDaily: 1500, fixedDose: true },
            pediatric: { dose: 10, unit: 'mg/kg', frequency: 'Q12H', maxDaily: 1000 },
            neonate: { dose: null, unit: null, frequency: null, maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: 'No change', note: 'Standard dosing' },
                moderate: { adjust: '250-500mg Q12H', note: 'Reduced dose' },
                severe: { adjust: '250-500mg Q18H', note: 'Extended interval' },
                esrd: { adjust: '250-500mg Q24H', note: 'Once daily' }
            },
            notes: 'UTI, respiratory, GI. Avoid antacids, dairy within 2hr.',
            warnings: ['Tendon rupture', 'QT prolongation', 'CNS effects', 'Avoid in children'],
            reference: 'https://www.ncbi.nlm.nih.gov/books/NBK535454/'
        },
        'levofloxacin-po': {
            name: 'Levofloxacin PO',
            route: 'PO',
            adult: { dose: 750, unit: 'mg', frequency: 'Q24H', maxDaily: 750, fixedDose: true },
            pediatric: { dose: 10, unit: 'mg/kg', frequency: 'Q12-24H', maxDaily: 750 },
            neonate: { dose: null, unit: null, frequency: null, maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: '750mg Q48H', note: 'Every other day' },
                moderate: { adjust: '750mg Q48H', note: 'Every other day' },
                severe: { adjust: '500mg Q48H', note: 'Reduced dose' },
                esrd: { adjust: '500mg Q48H', note: 'Post-HD if applicable' }
            },
            notes: 'CAP, sinusitis, UTI. 100% bioavailability.',
            warnings: ['Tendon rupture', 'QT prolongation', 'Aortic aneurysm risk'],
            reference: 'https://www.ncbi.nlm.nih.gov/books/NBK546023/'
        },
        'cefuroxime': {
            name: 'Cefuroxime (Ceftin/Zinacef)',
            route: 'PO/IV',
            adult: { dose: 500, unit: 'mg', frequency: 'Q12H (PO)', maxDaily: 1000, fixedDose: true },
            pediatric: { dose: 15, unit: 'mg/kg', frequency: 'Q12H', maxDaily: 1000 },
            neonate: { dose: null, unit: null, frequency: null, maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: 'No change', note: 'Standard dosing' },
                moderate: { adjust: 'No change', note: 'Standard dosing' },
                severe: { adjust: '250mg Q12H', note: 'Reduced dose' },
                esrd: { adjust: '250mg Q24H', note: 'Post-HD' }
            },
            notes: 'Second-gen ceph. CAP, UTI, sinusitis. IV: 750mg-1.5g Q8H.',
            warnings: ['Take with food for better absorption (PO)'],
            reference: 'https://www.ncbi.nlm.nih.gov/books/NBK538174/'
        },
        'cefpodoxime': {
            name: 'Cefpodoxime (Vantin)',
            route: 'PO',
            adult: { dose: 200, unit: 'mg', frequency: 'Q12H', maxDaily: 800, fixedDose: true },
            pediatric: { dose: 5, unit: 'mg/kg', frequency: 'Q12H', maxDaily: 400 },
            neonate: { dose: null, unit: null, frequency: null, maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: 'No change', note: 'Standard dosing' },
                moderate: { adjust: 'Q24H', note: 'Once daily' },
                severe: { adjust: 'Q24H', note: 'Once daily' },
                esrd: { adjust: 'Q48H', note: 'Every other day' }
            },
            notes: 'Third-gen oral ceph. Good for step-down therapy.',
            warnings: ['Take with food', 'GI upset possible'],
            reference: 'https://www.ncbi.nlm.nih.gov/books/NBK532906/'
        },
        'erythromycin': {
            name: 'Erythromycin',
            route: 'PO/IV',
            adult: { dose: 500, unit: 'mg', frequency: 'Q6H', maxDaily: 4000, fixedDose: true },
            pediatric: { dose: 10, unit: 'mg/kg', frequency: 'Q6H', maxDaily: 4000 },
            neonate: { dose: 10, unit: 'mg/kg', frequency: 'Q6H', maxDaily: null },
            renalAdjust: false,
            notes: 'Alternative for penicillin allergy. Prokinetic at low doses.',
            warnings: ['QT prolongation', 'GI upset very common', 'Many drug interactions'],
            reference: 'https://www.ncbi.nlm.nih.gov/books/NBK532249/'
        },
        'clarithromycin': {
            name: 'Clarithromycin (Biaxin)',
            route: 'PO',
            adult: { dose: 500, unit: 'mg', frequency: 'Q12H', maxDaily: 1000, fixedDose: true },
            pediatric: { dose: 7.5, unit: 'mg/kg', frequency: 'Q12H', maxDaily: 1000 },
            neonate: { dose: null, unit: null, frequency: null, maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: 'No change', note: 'Standard dosing' },
                moderate: { adjust: '250mg Q12H', note: 'Reduced dose' },
                severe: { adjust: '250mg Q12-24H', note: 'Reduced dose/frequency' },
                esrd: { adjust: '250mg Q24H', note: 'Once daily' }
            },
            notes: 'H. pylori regimens. MAC prophylaxis in HIV. Better tolerated than erythromycin.',
            warnings: ['QT prolongation', 'Drug interactions', 'Metallic taste'],
            reference: 'https://www.ncbi.nlm.nih.gov/books/NBK544294/'
        }
    },
    // ==========================================
    // ANTISEIZURE MEDICATIONS
    // ==========================================
    'antiseizure': {
        'levetiracetam': {
            name: 'Levetiracetam (Keppra)',
            route: 'IV/PO',
            adult: { dose: 500, unit: 'mg', frequency: 'Q12H (max 3000mg/day)', maxDaily: 3000, fixedDose: true },
            pediatric: { dose: 20, unit: 'mg/kg', frequency: 'Q12H (load 40-60 mg/kg)', maxDaily: 3000 },
            neonate: { dose: 20, unit: 'mg/kg', frequency: 'Q12H', maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: '500-1000mg Q12H', note: 'Standard dosing' },
                moderate: { adjust: '250-750mg Q12H', note: 'Reduced dose' },
                severe: { adjust: '250-500mg Q12H', note: 'Reduced dose' },
                esrd: { adjust: '500-1000mg Q24H', note: 'Supplement after HD' }
            },
            notes: 'Loading dose: 40-60 mg/kg IV for status. Titrate by 20 mg/kg/day weekly.',
            warnings: ['Behavioral changes', 'Irritability common in children', 'Suicidal ideation'],
            reference: 'https://www.ncbi.nlm.nih.gov/books/NBK499890/'
        },
        'phenytoin': {
            name: 'Phenytoin (Dilantin)',
            route: 'IV/PO',
            adult: { dose: 5, unit: 'mg/kg', frequency: 'Q8-12H (load 15-20 mg/kg)', maxDaily: 600, fixedDose: false },
            pediatric: { dose: 5, unit: 'mg/kg', frequency: 'Q8-12H (load 15-20 mg/kg)', maxDaily: 600 },
            neonate: { dose: 5, unit: 'mg/kg', frequency: 'Q8-12H (load 15-20 mg/kg)', maxDaily: null },
            renalAdjust: false,
            notes: 'Loading: 15-20 mg/kg IV (max 50 mg/min adult, 1-3 mg/kg/min peds). Monitor free levels.',
            warnings: ['Purple glove syndrome', 'Cardiac monitoring during IV load', 'Gingival hyperplasia', 'Drug interactions (CYP450)'],
            reference: 'https://www.ncbi.nlm.nih.gov/books/NBK532282/'
        },
        'fosphenytoin': {
            name: 'Fosphenytoin (Cerebyx)',
            route: 'IV/IM',
            adult: { dose: 5, unit: 'mg PE/kg', frequency: 'Q8-12H (load 15-20 mg PE/kg)', maxDaily: null },
            pediatric: { dose: 5, unit: 'mg PE/kg', frequency: 'Q8-12H (load 15-20 mg PE/kg)', maxDaily: null },
            neonate: { dose: 5, unit: 'mg PE/kg', frequency: 'Q8-12H (load 15-20 mg PE/kg)', maxDaily: null },
            renalAdjust: false,
            notes: 'PE = phenytoin equivalents. Can infuse faster than phenytoin (150 mg PE/min).',
            warnings: ['Hypotension', 'Cardiac arrhythmias', 'Paresthesias during infusion'],
            reference: 'https://www.ncbi.nlm.nih.gov/books/NBK532282/'
        },
        'phenobarbital': {
            name: 'Phenobarbital',
            route: 'IV/PO',
            adult: { dose: 2, unit: 'mg/kg', frequency: 'Q12-24H (load 15-20 mg/kg)', maxDaily: 300 },
            pediatric: { dose: 3, unit: 'mg/kg', frequency: 'Q12H (load 15-20 mg/kg)', maxDaily: 300 },
            neonate: { dose: 3, unit: 'mg/kg', frequency: 'Q24H (load 20 mg/kg)', maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: 'No change', note: 'Standard dosing' },
                moderate: { adjust: 'Q12-24H', note: 'Extended interval' },
                severe: { adjust: 'Q24H', note: 'Once daily' },
                esrd: { adjust: 'Per levels', note: 'Monitor levels closely' }
            },
            notes: 'First-line for neonatal seizures. Target level 15-40 mcg/mL.',
            warnings: ['Sedation', 'Respiratory depression', 'Paradoxical excitation in children'],
            reference: 'https://www.ncbi.nlm.nih.gov/books/NBK532277/'
        },
        'valproic-acid': {
            name: 'Valproic Acid (Depakene/Depakote)',
            route: 'IV/PO',
            adult: { dose: 15, unit: 'mg/kg', frequency: 'Q8-12H (max 60 mg/kg/day)', maxDaily: 3000, fixedDose: false },
            pediatric: { dose: 15, unit: 'mg/kg', frequency: 'Q8-12H (max 60 mg/kg/day)', maxDaily: 3000 },
            neonate: { dose: null, unit: null, frequency: null, maxDaily: null },
            renalAdjust: false,
            notes: 'IV loading: 20-40 mg/kg. Target level 50-100 mcg/mL. Use Depakote ER for once daily.',
            warnings: ['Hepatotoxicity (especially <2yo)', 'Pancreatitis', 'Thrombocytopenia', 'Teratogenic', 'Avoid with meropenem'],
            reference: 'https://www.ncbi.nlm.nih.gov/books/NBK559060/'
        },
        'lacosamide': {
            name: 'Lacosamide (Vimpat)',
            route: 'IV/PO',
            adult: { dose: 100, unit: 'mg', frequency: 'Q12H (max 400mg/day)', maxDaily: 400, fixedDose: true },
            pediatric: { dose: 2, unit: 'mg/kg', frequency: 'Q12H (max 12 mg/kg/day)', maxDaily: 400 },
            neonate: { dose: null, unit: null, frequency: null, maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: 'No change', note: 'Standard dosing' },
                moderate: { adjust: 'No change', note: 'Standard dosing' },
                severe: { adjust: 'Max 300mg/day', note: 'Reduced max dose' },
                esrd: { adjust: 'Max 300mg/day', note: 'Supplement 50% after HD' }
            },
            notes: 'IV loading: 200-400mg over 15-60 min. Titrate by 50-100mg/day weekly.',
            warnings: ['PR prolongation', 'Dizziness', 'Cardiac conduction effects'],
            reference: 'https://www.ncbi.nlm.nih.gov/books/NBK532944/'
        },
        'carbamazepine': {
            name: 'Carbamazepine (Tegretol)',
            route: 'PO',
            adult: { dose: 200, unit: 'mg', frequency: 'Q12H (titrate to 800-1200mg/day)', maxDaily: 1600, fixedDose: true },
            pediatric: { dose: 10, unit: 'mg/kg', frequency: 'Q12H (max 35 mg/kg/day)', maxDaily: 1000 },
            neonate: { dose: null, unit: null, frequency: null, maxDaily: null },
            renalAdjust: false,
            notes: 'Start low, titrate slowly. Target level 4-12 mcg/mL. Autoinduction occurs.',
            warnings: ['Aplastic anemia', 'SJS/TEN (HLA-B*1502 in Asians)', 'Hyponatremia', 'Drug interactions'],
            reference: 'https://www.ncbi.nlm.nih.gov/books/NBK482455/'
        },
        'oxcarbazepine': {
            name: 'Oxcarbazepine (Trileptal)',
            route: 'PO',
            adult: { dose: 300, unit: 'mg', frequency: 'Q12H (max 2400mg/day)', maxDaily: 2400, fixedDose: true },
            pediatric: { dose: 8, unit: 'mg/kg', frequency: 'Q12H (max 60 mg/kg/day)', maxDaily: 2400 },
            neonate: { dose: null, unit: null, frequency: null, maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: 'No change', note: 'Standard dosing' },
                moderate: { adjust: '50% dose', note: 'Half starting dose' },
                severe: { adjust: '50% dose', note: 'Half dose, titrate slowly' },
                esrd: { adjust: '50% dose', note: 'Half dose' }
            },
            notes: 'Better tolerated than carbamazepine. Start 8-10 mg/kg/day, titrate by 5 mg/kg/day weekly.',
            warnings: ['Hyponatremia (more common than CBZ)', 'Cross-sensitivity with CBZ allergy (25-30%)'],
            reference: 'https://www.ncbi.nlm.nih.gov/books/NBK519044/'
        },
        'topiramate': {
            name: 'Topiramate (Topamax)',
            route: 'PO',
            adult: { dose: 25, unit: 'mg', frequency: 'Q12H (titrate to 200-400mg/day)', maxDaily: 400, fixedDose: true },
            pediatric: { dose: 1, unit: 'mg/kg', frequency: 'Q12H (max 9 mg/kg/day)', maxDaily: 400 },
            neonate: { dose: null, unit: null, frequency: null, maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: 'No change', note: 'Standard dosing' },
                moderate: { adjust: '50% dose', note: 'Half dose' },
                severe: { adjust: '50% dose', note: 'Half dose' },
                esrd: { adjust: '50% dose', note: 'Supplement after HD' }
            },
            notes: 'Start 1-3 mg/kg/day, titrate by 1-3 mg/kg/day every 1-2 weeks.',
            warnings: ['Cognitive slowing', 'Kidney stones', 'Metabolic acidosis', 'Oligohidrosis/hyperthermia', 'Weight loss'],
            reference: 'https://www.ncbi.nlm.nih.gov/books/NBK554530/'
        },
        'clobazam': {
            name: 'Clobazam (Onfi)',
            route: 'PO',
            adult: { dose: 10, unit: 'mg', frequency: 'Q12H (max 40mg/day)', maxDaily: 40, fixedDose: true },
            pediatric: { dose: 0.25, unit: 'mg/kg', frequency: 'Q12H (max 1 mg/kg/day)', maxDaily: 40 },
            neonate: { dose: null, unit: null, frequency: null, maxDaily: null },
            renalAdjust: false,
            notes: 'Lennox-Gastaut adjunct. <30kg: max 20mg/day. ≥30kg: max 40mg/day.',
            warnings: ['Sedation', 'Drooling', 'Constipation', 'CYP2C19 poor metabolizers need dose reduction'],
            reference: 'https://www.ncbi.nlm.nih.gov/books/NBK545225/'
        },
        'clonazepam': {
            name: 'Clonazepam (Klonopin)',
            route: 'PO',
            adult: { dose: 0.5, unit: 'mg', frequency: 'Q8H (max 20mg/day)', maxDaily: 20, fixedDose: true },
            pediatric: { dose: 0.01, unit: 'mg/kg', frequency: 'Q8H (max 0.2 mg/kg/day)', maxDaily: 20 },
            neonate: { dose: null, unit: null, frequency: null, maxDaily: null },
            renalAdjust: false,
            notes: 'Start 0.01-0.03 mg/kg/day, titrate by 0.25-0.5 mg every 3 days.',
            warnings: ['Sedation', 'Respiratory depression', 'Tolerance may develop', 'Avoid abrupt discontinuation'],
            reference: 'https://www.ncbi.nlm.nih.gov/books/NBK556010/'
        },
        'diazepam': {
            name: 'Diazepam (Valium/Diastat)',
            route: 'IV/PO/PR',
            adult: { dose: 5, unit: 'mg', frequency: 'Q6-8H PRN (status: 5-10mg IV)', maxDaily: 40, fixedDose: true },
            pediatric: { dose: 0.2, unit: 'mg/kg', frequency: 'Q6-8H PRN (status: 0.2-0.5 mg/kg)', maxDaily: 10 },
            neonate: { dose: 0.2, unit: 'mg/kg', frequency: 'Q6-8H PRN', maxDaily: null },
            renalAdjust: false,
            notes: 'Status: 0.2-0.5 mg/kg IV (max 10mg). Rectal (Diastat): 0.5 mg/kg.',
            warnings: ['Respiratory depression', 'Hypotension', 'Paradoxical agitation', 'Contains propylene glycol'],
            reference: 'https://www.ncbi.nlm.nih.gov/books/NBK537022/'
        },
        'lorazepam': {
            name: 'Lorazepam (Ativan)',
            route: 'IV/PO',
            adult: { dose: 1, unit: 'mg', frequency: 'Q6-8H PRN (status: 4mg IV)', maxDaily: 10, fixedDose: true },
            pediatric: { dose: 0.05, unit: 'mg/kg', frequency: 'Q6-8H PRN (status: 0.1 mg/kg)', maxDaily: 4 },
            neonate: { dose: 0.05, unit: 'mg/kg', frequency: 'Q6-8H PRN', maxDaily: null },
            renalAdjust: false,
            notes: 'First-line for status epilepticus. Max 0.1 mg/kg/dose (max 4mg). May repeat x1 in 5-10 min.',
            warnings: ['Respiratory depression', 'Hypotension', 'Contains propylene glycol (IV)', 'Refrigerate IV form'],
            reference: 'https://www.ncbi.nlm.nih.gov/books/NBK532890/'
        },
        'midazolam': {
            name: 'Midazolam (Versed)',
            route: 'IV/IM/IN/Buccal',
            adult: { dose: 2, unit: 'mg', frequency: 'PRN (status: 5-10mg IM/IN)', maxDaily: null, fixedDose: true },
            pediatric: { dose: 0.1, unit: 'mg/kg', frequency: 'PRN (status: 0.2 mg/kg IN/IM)', maxDaily: 10 },
            neonate: { dose: 0.05, unit: 'mg/kg', frequency: 'PRN', maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: 'No change', note: 'Standard dosing' },
                moderate: { adjust: 'Reduce dose', note: 'Titrate carefully' },
                severe: { adjust: 'Reduce dose', note: 'Prolonged sedation risk' },
                esrd: { adjust: 'Reduce dose', note: 'Use with caution' }
            },
            notes: 'Intranasal: 0.2 mg/kg (max 10mg). Buccal: 0.5 mg/kg (max 10mg). IM: 0.2 mg/kg.',
            warnings: ['Respiratory depression', 'Hypotension', 'Paradoxical reactions'],
            reference: 'https://www.ncbi.nlm.nih.gov/books/NBK537321/'
        },
        'vigabatrin': {
            name: 'Vigabatrin (Sabril)',
            route: 'PO',
            adult: { dose: 500, unit: 'mg', frequency: 'Q12H (max 3g/day)', maxDaily: 3000, fixedDose: true },
            pediatric: { dose: 50, unit: 'mg/kg', frequency: 'Q12H (infantile spasms: 100-150 mg/kg/day)', maxDaily: 3000 },
            neonate: { dose: null, unit: null, frequency: null, maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: '75% dose', note: 'Reduce dose' },
                moderate: { adjust: '50% dose', note: 'Half dose' },
                severe: { adjust: '25% dose', note: 'Quarter dose' },
                esrd: { adjust: 'Per levels', note: 'Significant reduction' }
            },
            notes: 'First-line for infantile spasms (West syndrome). Start 50 mg/kg/day, increase to 100-150 mg/kg/day.',
            warnings: ['Irreversible vision loss (retinal toxicity)', 'Requires vision monitoring every 3 months', 'REMS program required'],
            reference: 'https://www.ncbi.nlm.nih.gov/books/NBK532934/'
        },
        'acth': {
            name: 'ACTH (Acthar Gel)',
            route: 'IM',
            adult: { dose: null, unit: null, frequency: null, maxDaily: null },
            pediatric: { dose: 150, unit: 'units/m²', frequency: 'Q12H x 2-6 weeks', maxDaily: null },
            neonate: { dose: 150, unit: 'units/m²', frequency: 'Q12H x 2-6 weeks', maxDaily: null },
            renalAdjust: false,
            notes: 'Infantile spasms: 150 units/m²/day divided BID. High-dose protocol preferred.',
            warnings: ['Hypertension', 'Infections', 'Irritability', 'Electrolyte imbalances', 'Cardiac hypertrophy'],
            reference: 'https://www.ncbi.nlm.nih.gov/books/NBK532880/'
        }
    },
    // ==========================================
    // NEPHROLOGY MEDICATIONS
    // ==========================================
    'nephrology': {
        'furosemide': {
            name: 'Furosemide (Lasix)',
            route: 'IV/PO',
            adult: { dose: 40, unit: 'mg', frequency: 'Q6-12H', maxDaily: 600, fixedDose: true },
            pediatric: { dose: 1, unit: 'mg/kg', frequency: 'Q6-12H (max 6 mg/kg/dose)', maxDaily: null },
            neonate: { dose: 1, unit: 'mg/kg', frequency: 'Q12-24H', maxDaily: null },
            renalAdjust: false,
            notes: 'IV onset 5 min, PO onset 30-60 min. Continuous infusion: 0.1-0.4 mg/kg/hr.',
            warnings: ['Ototoxicity (high doses, rapid IV)', 'Hypokalemia', 'Hypocalcemia', 'Sulfa allergy'],
            reference: 'https://www.ncbi.nlm.nih.gov/books/NBK499921/'
        },
        'bumetanide': {
            name: 'Bumetanide (Bumex)',
            route: 'IV/PO',
            adult: { dose: 1, unit: 'mg', frequency: 'Q6-8H (max 10mg/day)', maxDaily: 10, fixedDose: true },
            pediatric: { dose: 0.015, unit: 'mg/kg', frequency: 'Q6-8H (max 0.1 mg/kg/dose)', maxDaily: null },
            neonate: { dose: 0.01, unit: 'mg/kg', frequency: 'Q12-24H', maxDaily: null },
            renalAdjust: false,
            notes: '40:1 potency ratio vs furosemide. Better bioavailability than furosemide.',
            warnings: ['Ototoxicity', 'Hypokalemia', 'Muscle cramps'],
            reference: 'https://www.ncbi.nlm.nih.gov/books/NBK532877/'
        },
        'hydrochlorothiazide': {
            name: 'Hydrochlorothiazide (HCTZ)',
            route: 'PO',
            adult: { dose: 25, unit: 'mg', frequency: 'Q24H (max 50mg/day)', maxDaily: 50, fixedDose: true },
            pediatric: { dose: 1, unit: 'mg/kg', frequency: 'Q12H (max 3 mg/kg/day)', maxDaily: 200 },
            neonate: { dose: 1, unit: 'mg/kg', frequency: 'Q12H', maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: 'No change', note: 'Standard dosing' },
                moderate: { adjust: 'May be ineffective', note: 'Limited efficacy' },
                severe: { adjust: 'Avoid', note: 'Ineffective' },
                esrd: { adjust: 'Avoid', note: 'Not effective' }
            },
            notes: 'Synergistic with loop diuretics. Used in nephrogenic DI.',
            warnings: ['Hypokalemia', 'Hyperuricemia', 'Photosensitivity', 'Sulfa allergy'],
            reference: 'https://www.ncbi.nlm.nih.gov/books/NBK430766/'
        },
        'spironolactone': {
            name: 'Spironolactone (Aldactone)',
            route: 'PO',
            adult: { dose: 25, unit: 'mg', frequency: 'Q12-24H (max 400mg/day)', maxDaily: 400, fixedDose: true },
            pediatric: { dose: 1, unit: 'mg/kg', frequency: 'Q12H (max 3.3 mg/kg/day)', maxDaily: 200 },
            neonate: { dose: 1, unit: 'mg/kg', frequency: 'Q12H', maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: 'No change', note: 'Monitor K+' },
                moderate: { adjust: 'Use with caution', note: 'Monitor K+ closely' },
                severe: { adjust: 'Avoid', note: 'Hyperkalemia risk' },
                esrd: { adjust: 'Contraindicated', note: 'Do not use' }
            },
            notes: 'Potassium-sparing. Used in heart failure, ascites, hyperaldosteronism.',
            warnings: ['Hyperkalemia', 'Gynecomastia', 'GI upset'],
            reference: 'https://www.ncbi.nlm.nih.gov/books/NBK554421/'
        },
        'metolazone': {
            name: 'Metolazone (Zaroxolyn)',
            route: 'PO',
            adult: { dose: 5, unit: 'mg', frequency: 'Q24H (max 20mg/day)', maxDaily: 20, fixedDose: true },
            pediatric: { dose: 0.2, unit: 'mg/kg', frequency: 'Q12-24H (max 0.4 mg/kg/day)', maxDaily: 20 },
            neonate: { dose: 0.2, unit: 'mg/kg', frequency: 'Q24H', maxDaily: null },
            renalAdjust: false,
            notes: 'Give 30 min before loop diuretic for synergy. Effective even with low GFR.',
            warnings: ['Profound diuresis with loop diuretics', 'Hypokalemia', 'Hyponatremia']
        },
        'amlodipine': {
            name: 'Amlodipine (Norvasc)',
            route: 'PO',
            adult: { dose: 5, unit: 'mg', frequency: 'Q24H (max 10mg/day)', maxDaily: 10, fixedDose: true },
            pediatric: { dose: 0.1, unit: 'mg/kg', frequency: 'Q24H (max 0.6 mg/kg/day)', maxDaily: 10 },
            neonate: { dose: 0.05, unit: 'mg/kg', frequency: 'Q24H', maxDaily: null },
            renalAdjust: false,
            notes: 'Long-acting CCB. Start low, titrate every 1-2 weeks.',
            warnings: ['Peripheral edema', 'Gingival hyperplasia', 'Headache']
        },
        'lisinopril': {
            name: 'Lisinopril (Zestril)',
            route: 'PO',
            adult: { dose: 10, unit: 'mg', frequency: 'Q24H (max 40mg/day)', maxDaily: 40, fixedDose: true },
            pediatric: { dose: 0.1, unit: 'mg/kg', frequency: 'Q24H (max 0.6 mg/kg/day)', maxDaily: 40 },
            neonate: { dose: null, unit: null, frequency: null, maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: '75% dose', note: 'Reduce starting dose' },
                moderate: { adjust: '50% dose', note: 'Half dose' },
                severe: { adjust: '25% dose', note: 'Quarter dose' },
                esrd: { adjust: '25% dose', note: 'Start 2.5mg' }
            },
            notes: 'Proteinuria reduction. Start low and titrate. Monitor K+ and Cr.',
            warnings: ['Hyperkalemia', 'Angioedema', 'Cough', 'Teratogenic', 'Acute kidney injury risk']
        },
        'enalapril': {
            name: 'Enalapril (Vasotec)',
            route: 'PO/IV',
            adult: { dose: 5, unit: 'mg', frequency: 'Q12-24H (max 40mg/day)', maxDaily: 40, fixedDose: true },
            pediatric: { dose: 0.1, unit: 'mg/kg', frequency: 'Q12-24H (max 0.5 mg/kg/day)', maxDaily: 40 },
            neonate: { dose: 0.04, unit: 'mg/kg', frequency: 'Q12-24H', maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: 'No change', note: 'Standard dosing' },
                moderate: { adjust: '75% dose', note: 'Reduce dose' },
                severe: { adjust: '50% dose', note: 'Half dose' },
                esrd: { adjust: '50% dose', note: 'Post-HD supplementation' }
            },
            notes: 'IV enalaprilat: 0.005-0.01 mg/kg/dose Q8-24H.',
            warnings: ['Hyperkalemia', 'Angioedema', 'Cough', 'Teratogenic']
        },
        'losartan': {
            name: 'Losartan (Cozaar)',
            route: 'PO',
            adult: { dose: 50, unit: 'mg', frequency: 'Q24H (max 100mg/day)', maxDaily: 100, fixedDose: true },
            pediatric: { dose: 0.7, unit: 'mg/kg', frequency: 'Q24H (max 1.4 mg/kg/day)', maxDaily: 100 },
            neonate: { dose: null, unit: null, frequency: null, maxDaily: null },
            renalAdjust: false,
            notes: 'ARB - no cough. Alternative for ACE-I intolerance.',
            warnings: ['Hyperkalemia', 'Teratogenic', 'Hypotension']
        },
        'sodium-bicarbonate': {
            name: 'Sodium Bicarbonate',
            route: 'IV/PO',
            adult: { dose: 1, unit: 'mEq/kg', frequency: 'PRN (acidosis correction)', maxDaily: null, fixedDose: false },
            pediatric: { dose: 1, unit: 'mEq/kg', frequency: 'PRN (CKD: 1-2 mEq/kg/day PO)', maxDaily: null },
            neonate: { dose: 1, unit: 'mEq/kg', frequency: 'PRN (0.5-1 mEq/mL dilution)', maxDaily: null },
            renalAdjust: false,
            notes: 'Acidosis: (base deficit × weight × 0.3). CKD maintenance: 1-2 mEq/kg/day divided.',
            warnings: ['Hypernatremia', 'Hypokalemia', 'Tissue necrosis if extravasated', 'Avoid with hypocalcemia']
        },
        'sodium-polystyrene': {
            name: 'Sodium Polystyrene (Kayexalate)',
            route: 'PO/PR',
            adult: { dose: 15, unit: 'g', frequency: 'Q6H (max 60g/day)', maxDaily: 60, fixedDose: true },
            pediatric: { dose: 1, unit: 'g/kg', frequency: 'Q6H (max 1 g/kg/dose)', maxDaily: null },
            neonate: { dose: 1, unit: 'g/kg', frequency: 'Q6H', maxDaily: null },
            renalAdjust: false,
            notes: 'Give with sorbitol orally. Rectal retention enema: hold 30-60 min.',
            warnings: ['Intestinal necrosis (especially with sorbitol)', 'Sodium loading', 'Constipation', 'Slow onset (hours)']
        },
        'patiromer': {
            name: 'Patiromer (Veltassa)',
            route: 'PO',
            adult: { dose: 8.4, unit: 'g', frequency: 'Q24H (max 25.2g/day)', maxDaily: 25.2, fixedDose: true },
            pediatric: { dose: null, unit: null, frequency: null, maxDaily: null },
            neonate: { dose: null, unit: null, frequency: null, maxDaily: null },
            renalAdjust: false,
            notes: 'Take with food. Separate from other meds by 3 hours.',
            warnings: ['Hypomagnesemia', 'GI upset', 'Constipation', 'Drug binding interactions']
        },
        'sevelamer': {
            name: 'Sevelamer (Renvela)',
            route: 'PO',
            adult: { dose: 800, unit: 'mg', frequency: 'TID with meals', maxDaily: null, fixedDose: true },
            pediatric: { dose: 800, unit: 'mg', frequency: 'TID with meals (BSA-based)', maxDaily: null },
            neonate: { dose: null, unit: null, frequency: null, maxDaily: null },
            renalAdjust: false,
            notes: 'Phosphate binder. Give with meals. Adjust based on phosphorus levels.',
            warnings: ['GI obstruction risk', 'Constipation', 'May bind other medications']
        },
        'calcitriol': {
            name: 'Calcitriol (Rocaltrol)',
            route: 'PO/IV',
            adult: { dose: 0.25, unit: 'mcg', frequency: 'Q24H', maxDaily: 2, fixedDose: true },
            pediatric: { dose: 0.01, unit: 'mcg/kg', frequency: 'Q24H (max 0.5 mcg/day)', maxDaily: 0.5 },
            neonate: { dose: 0.01, unit: 'mcg/kg', frequency: 'Q24H', maxDaily: null },
            renalAdjust: false,
            notes: 'Active vitamin D. Monitor Ca, PO4, PTH. Adjust based on labs.',
            warnings: ['Hypercalcemia', 'Hyperphosphatemia', 'Soft tissue calcification']
        },
        'darbepoetin': {
            name: 'Darbepoetin (Aranesp)',
            route: 'IV/SC',
            adult: { dose: 0.45, unit: 'mcg/kg', frequency: 'Weekly or Q2weeks', maxDaily: null, fixedDose: false },
            pediatric: { dose: 0.45, unit: 'mcg/kg', frequency: 'Weekly (adjust to Hgb)', maxDaily: null },
            neonate: { dose: null, unit: null, frequency: null, maxDaily: null },
            renalAdjust: false,
            notes: 'Target Hgb 10-11.5 g/dL. Avoid rapid rise (>1 g/dL in 2 weeks).',
            warnings: ['Hypertension', 'Thrombosis', 'Pure red cell aplasia', 'Increased mortality if Hgb >11']
        },
        'epoetin-alfa': {
            name: 'Epoetin Alfa (Epogen)',
            route: 'IV/SC',
            adult: { dose: 50, unit: 'units/kg', frequency: 'TIW', maxDaily: null, fixedDose: false },
            pediatric: { dose: 50, unit: 'units/kg', frequency: 'TIW (range 50-300 units/kg)', maxDaily: null },
            neonate: { dose: 200, unit: 'units/kg', frequency: 'TIW', maxDaily: null },
            renalAdjust: false,
            notes: 'Start 50-100 units/kg TIW. Adjust by 25% every 4 weeks based on Hgb.',
            warnings: ['Hypertension', 'Thrombosis', 'Seizures', 'Target Hgb 10-11.5 g/dL']
        }
    },
    // ==========================================
    // CARDIAC/CARDIOVASCULAR MEDICATIONS
    // ==========================================
    'cardiac': {
        'digoxin': {
            name: 'Digoxin (Lanoxin)',
            route: 'IV/PO',
            adult: { dose: 0.125, unit: 'mg', frequency: 'Q24H (load 8-12 mcg/kg)', maxDaily: 0.5, fixedDose: true },
            pediatric: { dose: 5, unit: 'mcg/kg', frequency: 'Q12H (load 20-30 mcg/kg)', maxDaily: null },
            neonate: { dose: 4, unit: 'mcg/kg', frequency: 'Q12H (load 20-30 mcg/kg)', maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: '75% dose', note: 'Reduce dose' },
                moderate: { adjust: '50% dose', note: 'Half dose' },
                severe: { adjust: '25% dose', note: 'Quarter dose' },
                esrd: { adjust: '10-25% dose', note: 'Significant reduction' }
            },
            notes: 'TDM: 0.8-2.0 ng/mL. Loading over 24h in 3 divided doses. PO is 70-80% IV dose.',
            warnings: ['Arrhythmias', 'Visual changes', 'GI upset', 'Hypokalemia increases toxicity']
        },
        'dopamine': {
            name: 'Dopamine',
            route: 'IV infusion',
            adult: { dose: 5, unit: 'mcg/kg/min', frequency: 'Continuous (range 2-20)', maxDaily: null, fixedDose: false },
            pediatric: { dose: 5, unit: 'mcg/kg/min', frequency: 'Continuous (range 2-20)', maxDaily: null },
            neonate: { dose: 5, unit: 'mcg/kg/min', frequency: 'Continuous (range 2-20)', maxDaily: null },
            renalAdjust: false,
            notes: 'Low: 2-5 (renal), Medium: 5-10 (cardiac), High: 10-20 (vasopressor).',
            warnings: ['Arrhythmias', 'Tissue necrosis if extravasated', 'Tachycardia']
        },
        'dobutamine': {
            name: 'Dobutamine',
            route: 'IV infusion',
            adult: { dose: 5, unit: 'mcg/kg/min', frequency: 'Continuous (range 2.5-20)', maxDaily: null, fixedDose: false },
            pediatric: { dose: 5, unit: 'mcg/kg/min', frequency: 'Continuous (range 2.5-20)', maxDaily: null },
            neonate: { dose: 5, unit: 'mcg/kg/min', frequency: 'Continuous (range 2.5-20)', maxDaily: null },
            renalAdjust: false,
            notes: 'Inotrope with mild vasodilation. Start 2.5-5, titrate to effect.',
            warnings: ['Arrhythmias', 'Hypotension', 'Tachycardia']
        },
        'epinephrine': {
            name: 'Epinephrine (Adrenaline)',
            route: 'IV/IM/SC',
            adult: { dose: 0.1, unit: 'mcg/kg/min', frequency: 'Continuous (range 0.01-1)', maxDaily: null, fixedDose: false },
            pediatric: { dose: 0.1, unit: 'mcg/kg/min', frequency: 'Continuous (range 0.01-1)', maxDaily: null },
            neonate: { dose: 0.1, unit: 'mcg/kg/min', frequency: 'Continuous (range 0.01-1)', maxDaily: null },
            renalAdjust: false,
            notes: 'Cardiac arrest: 0.01 mg/kg IV (max 1mg). Anaphylaxis: 0.01 mg/kg IM (max 0.5mg).',
            warnings: ['Arrhythmias', 'Hypertension', 'Tissue necrosis', 'Myocardial ischemia']
        },
        'norepinephrine': {
            name: 'Norepinephrine (Levophed)',
            route: 'IV infusion',
            adult: { dose: 0.1, unit: 'mcg/kg/min', frequency: 'Continuous (range 0.01-2)', maxDaily: null, fixedDose: false },
            pediatric: { dose: 0.1, unit: 'mcg/kg/min', frequency: 'Continuous (range 0.01-2)', maxDaily: null },
            neonate: { dose: 0.05, unit: 'mcg/kg/min', frequency: 'Continuous (range 0.01-1)', maxDaily: null },
            renalAdjust: false,
            notes: 'First-line vasopressor for septic shock. Start 0.05-0.1 mcg/kg/min.',
            warnings: ['Tissue necrosis if extravasated', 'Arrhythmias', 'Peripheral ischemia']
        },
        'milrinone': {
            name: 'Milrinone (Primacor)',
            route: 'IV infusion',
            adult: { dose: 0.5, unit: 'mcg/kg/min', frequency: 'Continuous (range 0.25-0.75)', maxDaily: null, fixedDose: false },
            pediatric: { dose: 0.5, unit: 'mcg/kg/min', frequency: 'Continuous (load 50 mcg/kg over 10 min)', maxDaily: null },
            neonate: { dose: 0.5, unit: 'mcg/kg/min', frequency: 'Continuous', maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: 'No change', note: 'Standard dosing' },
                moderate: { adjust: '0.33 mcg/kg/min', note: 'Reduced rate' },
                severe: { adjust: '0.23 mcg/kg/min', note: 'Reduced rate' },
                esrd: { adjust: '0.2 mcg/kg/min', note: 'Significant reduction' }
            },
            notes: 'Loading dose optional (hypotension risk). PDE3 inhibitor - inodilator.',
            warnings: ['Hypotension', 'Arrhythmias', 'Thrombocytopenia']
        },
        'propranolol': {
            name: 'Propranolol (Inderal)',
            route: 'IV/PO',
            adult: { dose: 40, unit: 'mg', frequency: 'Q8-12H', maxDaily: 640, fixedDose: true },
            pediatric: { dose: 1, unit: 'mg/kg', frequency: 'Q6-8H (max 4 mg/kg/day)', maxDaily: 640 },
            neonate: { dose: 0.25, unit: 'mg/kg', frequency: 'Q6H', maxDaily: null },
            renalAdjust: false,
            notes: 'IV: 0.01-0.1 mg/kg (max 1mg) slow push. Also used for hemangiomas.',
            warnings: ['Bradycardia', 'Hypotension', 'Bronchospasm', 'Hypoglycemia masking']
        },
        'atenolol': {
            name: 'Atenolol (Tenormin)',
            route: 'PO',
            adult: { dose: 50, unit: 'mg', frequency: 'Q24H (max 100mg/day)', maxDaily: 100, fixedDose: true },
            pediatric: { dose: 1, unit: 'mg/kg', frequency: 'Q24H (max 2 mg/kg/day)', maxDaily: 100 },
            neonate: { dose: null, unit: null, frequency: null, maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: 'Q24H', note: 'Standard dosing' },
                moderate: { adjust: 'Q48H', note: 'Every other day' },
                severe: { adjust: 'Q48H', note: 'Every other day, max 25mg' },
                esrd: { adjust: 'Post-HD', note: 'Give after dialysis' }
            },
            notes: 'Beta-1 selective. Less CNS effects than propranolol.',
            warnings: ['Bradycardia', 'Hypotension', 'Fatigue']
        },
        'hydralazine': {
            name: 'Hydralazine (Apresoline)',
            route: 'IV/PO',
            adult: { dose: 25, unit: 'mg', frequency: 'Q6-8H (max 300mg/day)', maxDaily: 300, fixedDose: true },
            pediatric: { dose: 0.75, unit: 'mg/kg', frequency: 'Q6H (max 7.5 mg/kg/day)', maxDaily: 200 },
            neonate: { dose: 0.25, unit: 'mg/kg', frequency: 'Q6-8H', maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: 'Q8H', note: 'Extended interval' },
                moderate: { adjust: 'Q8-12H', note: 'Extended interval' },
                severe: { adjust: 'Q12-24H', note: 'Extended interval' },
                esrd: { adjust: 'Q12-24H', note: 'Extended interval' }
            },
            notes: 'IV: 0.1-0.5 mg/kg/dose Q4-6H (max 20mg). Direct arterial vasodilator.',
            warnings: ['Reflex tachycardia', 'Lupus-like syndrome', 'Headache']
        },
        'nifedipine': {
            name: 'Nifedipine (Procardia)',
            route: 'PO',
            adult: { dose: 30, unit: 'mg', frequency: 'Q24H (XL)', maxDaily: 120, fixedDose: true },
            pediatric: { dose: 0.25, unit: 'mg/kg', frequency: 'Q6-8H (max 3 mg/kg/day)', maxDaily: 120 },
            neonate: { dose: 0.25, unit: 'mg/kg', frequency: 'Q6-8H', maxDaily: null },
            renalAdjust: false,
            notes: 'Immediate-release: 0.25-0.5 mg/kg/dose. Extended-release preferred for HTN.',
            warnings: ['Hypotension', 'Reflex tachycardia', 'Headache', 'Flushing', 'Peripheral edema']
        },
        'adenosine': {
            name: 'Adenosine (Adenocard)',
            route: 'IV rapid push',
            adult: { dose: 6, unit: 'mg', frequency: 'x1, may repeat 12mg x2', maxDaily: 30, fixedDose: true },
            pediatric: { dose: 0.1, unit: 'mg/kg', frequency: 'x1 (max 6mg), may double to 0.2 mg/kg (max 12mg)', maxDaily: null },
            neonate: { dose: 0.05, unit: 'mg/kg', frequency: 'x1, may increase by 0.05', maxDaily: null },
            renalAdjust: false,
            notes: 'Give rapid IV push followed by flush. Half-life 10 seconds.',
            warnings: ['Transient asystole', 'Bronchospasm', 'Flushing', 'Chest pressure']
        },
        'amiodarone': {
            name: 'Amiodarone (Cordarone)',
            route: 'IV/PO',
            adult: { dose: 150, unit: 'mg', frequency: 'Load then 1 mg/min x 6hr, then 0.5 mg/min', maxDaily: 2200, fixedDose: true },
            pediatric: { dose: 5, unit: 'mg/kg', frequency: 'Load over 30-60 min (max 300mg)', maxDaily: null },
            neonate: { dose: 5, unit: 'mg/kg', frequency: 'Load over 30-60 min', maxDaily: null },
            renalAdjust: false,
            notes: 'Pulseless VT/VF: 5 mg/kg IV bolus. Maintenance: 5-15 mcg/kg/min.',
            warnings: ['Hypotension', 'Bradycardia', 'Thyroid dysfunction', 'Pulmonary toxicity', 'Hepatotoxicity', 'QT prolongation']
        },
        'atropine': {
            name: 'Atropine',
            route: 'IV/IM/ET',
            adult: { dose: 0.5, unit: 'mg', frequency: 'Q3-5min PRN (max 3mg)', maxDaily: 3, fixedDose: true },
            pediatric: { dose: 0.02, unit: 'mg/kg', frequency: 'Q5min (min 0.1mg, max 0.5mg child, 1mg adolescent)', maxDaily: null },
            neonate: { dose: 0.02, unit: 'mg/kg', frequency: 'Q5min (min 0.1mg)', maxDaily: null },
            renalAdjust: false,
            notes: 'Minimum dose 0.1mg to avoid paradoxical bradycardia. ET dose 2-3x IV.',
            warnings: ['Tachycardia', 'Mydriasis', 'Urinary retention', 'Fever', 'Dry mouth']
        },
        'captopril': {
            name: 'Captopril (Capoten)',
            route: 'PO',
            adult: { dose: 25, unit: 'mg', frequency: 'Q8H (max 450mg/day)', maxDaily: 450, fixedDose: true },
            pediatric: { dose: 0.3, unit: 'mg/kg', frequency: 'Q8H (max 6 mg/kg/day)', maxDaily: 450 },
            neonate: { dose: 0.01, unit: 'mg/kg', frequency: 'Q8-12H (max 0.5 mg/kg/day)', maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: '75% dose', note: 'Reduce dose' },
                moderate: { adjust: '50% dose', note: 'Half dose' },
                severe: { adjust: '25% dose', note: 'Quarter dose' },
                esrd: { adjust: '25% dose', note: 'Post-HD supplement' }
            },
            notes: 'Short-acting ACE-I. Useful for dose titration. Give on empty stomach.',
            warnings: ['Hyperkalemia', 'Cough', 'Angioedema', 'Neutropenia', 'Proteinuria']
        },
        'sildenafil': {
            name: 'Sildenafil (Revatio)',
            route: 'IV/PO',
            adult: { dose: 20, unit: 'mg', frequency: 'Q8H', maxDaily: 60, fixedDose: true },
            pediatric: { dose: 0.5, unit: 'mg/kg', frequency: 'Q6-8H (max 2 mg/kg/dose)', maxDaily: null },
            neonate: { dose: 0.5, unit: 'mg/kg', frequency: 'Q6-8H', maxDaily: null },
            renalAdjust: false,
            notes: 'Pulmonary hypertension. IV: 0.4 mg/kg load, then 1.6 mg/kg/day.',
            warnings: ['Hypotension', 'Headache', 'Flushing', 'Contraindicated with nitrates']
        },
        'prostaglandin-e1': {
            name: 'Prostaglandin E1 (Alprostadil)',
            route: 'IV infusion',
            adult: { dose: null, unit: null, frequency: null, maxDaily: null },
            pediatric: { dose: 0.05, unit: 'mcg/kg/min', frequency: 'Continuous (range 0.01-0.1)', maxDaily: null },
            neonate: { dose: 0.05, unit: 'mcg/kg/min', frequency: 'Continuous (range 0.01-0.1)', maxDaily: null },
            renalAdjust: false,
            notes: 'Maintains PDA patency. Start 0.05-0.1, reduce to 0.01 once effective.',
            warnings: ['Apnea (12%)', 'Fever', 'Hypotension', 'Seizures', 'Have intubation ready']
        },
        'indomethacin': {
            name: 'Indomethacin (Indocin)',
            route: 'IV',
            adult: { dose: null, unit: null, frequency: null, maxDaily: null },
            pediatric: { dose: null, unit: null, frequency: null, maxDaily: null },
            neonate: { dose: 0.2, unit: 'mg/kg', frequency: 'x1, then 0.1-0.25 mg/kg Q12-24H x 2 doses', maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: 'No change', note: 'Monitor UOP' },
                moderate: { adjust: 'Hold if UOP <0.6', note: 'Monitor closely' },
                severe: { adjust: 'Contraindicated', note: 'Do not use' },
                esrd: { adjust: 'Contraindicated', note: 'Do not use' }
            },
            notes: 'PDA closure. Dosing varies by age: <48h: 0.2, 0.1, 0.1. 2-7d: 0.2, 0.2, 0.2. >7d: 0.2, 0.25, 0.25.',
            warnings: ['Oliguria', 'GI bleeding', 'IVH worsening', 'NEC risk', 'Platelet dysfunction']
        },
        'ibuprofen-lysine': {
            name: 'Ibuprofen Lysine (NeoProfen)',
            route: 'IV',
            adult: { dose: null, unit: null, frequency: null, maxDaily: null },
            pediatric: { dose: null, unit: null, frequency: null, maxDaily: null },
            neonate: { dose: 10, unit: 'mg/kg', frequency: 'x1, then 5 mg/kg Q24H x 2 doses', maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: 'Monitor UOP', note: 'Standard dosing' },
                moderate: { adjust: 'Hold if UOP <0.6', note: 'Monitor closely' },
                severe: { adjust: 'Contraindicated', note: 'Do not use' },
                esrd: { adjust: 'Contraindicated', note: 'Do not use' }
            },
            notes: 'PDA closure alternative to indomethacin. May have less renal effects.',
            warnings: ['Oliguria', 'GI effects', 'Pulmonary hypertension', 'Platelet dysfunction']
        }
    },
    // ==========================================
    // RESPIRATORY MEDICATIONS
    // ==========================================
    'respiratory': {
        'albuterol': {
            name: 'Albuterol (Ventolin/ProAir)',
            route: 'Inhaled/Nebulized',
            adult: { dose: 2.5, unit: 'mg', frequency: 'Q4-6H PRN (acute: Q20min x3)', maxDaily: null, fixedDose: true },
            pediatric: { dose: 0.15, unit: 'mg/kg', frequency: 'Q4-6H PRN (min 2.5mg, max 5mg)', maxDaily: null },
            neonate: { dose: 0.1, unit: 'mg/kg', frequency: 'Q4-6H PRN', maxDaily: null },
            renalAdjust: false,
            notes: 'MDI: 2-4 puffs Q4-6H. Continuous neb: 0.5 mg/kg/hr (max 20 mg/hr).',
            warnings: ['Tachycardia', 'Hypokalemia', 'Tremor', 'Hyperglycemia']
        },
        'ipratropium': {
            name: 'Ipratropium (Atrovent)',
            route: 'Inhaled/Nebulized',
            adult: { dose: 500, unit: 'mcg', frequency: 'Q6H (acute: Q20min x3 with albuterol)', maxDaily: null, fixedDose: true },
            pediatric: { dose: 250, unit: 'mcg', frequency: 'Q6H (acute: Q20min x3)', maxDaily: null },
            neonate: { dose: 125, unit: 'mcg', frequency: 'Q6H', maxDaily: null },
            renalAdjust: false,
            notes: 'Most effective when combined with albuterol. MDI: 2-4 puffs Q6H.',
            warnings: ['Dry mouth', 'Urinary retention', 'Narrow-angle glaucoma']
        },
        'budesonide-neb': {
            name: 'Budesonide (Pulmicort)',
            route: 'Nebulized',
            adult: { dose: 0.5, unit: 'mg', frequency: 'Q12H (max 1mg Q12H)', maxDaily: 2, fixedDose: true },
            pediatric: { dose: 0.25, unit: 'mg', frequency: 'Q12H (max 0.5mg Q12H)', maxDaily: 1 },
            neonate: { dose: 0.25, unit: 'mg', frequency: 'Q12H', maxDaily: null },
            renalAdjust: false,
            notes: 'Croup: 2mg x1 or 1mg x2. Maintenance asthma: 0.25-0.5mg Q12H.',
            warnings: ['Oral thrush', 'Hoarseness', 'Growth suppression with long-term use']
        },
        'dexamethasone-croup': {
            name: 'Dexamethasone (Croup)',
            route: 'PO/IM/IV',
            adult: { dose: null, unit: null, frequency: null, maxDaily: null },
            pediatric: { dose: 0.6, unit: 'mg/kg', frequency: 'x1 dose (max 10mg)', maxDaily: 10 },
            neonate: { dose: null, unit: null, frequency: null, maxDaily: null },
            renalAdjust: false,
            notes: 'Single dose for croup. May repeat x1 if needed. PO as effective as IM.',
            warnings: ['Hyperglycemia', 'Behavioral changes', 'Immunosuppression']
        },
        'prednisolone': {
            name: 'Prednisolone (Orapred)',
            route: 'PO',
            adult: { dose: 40, unit: 'mg', frequency: 'Q24H x 5 days', maxDaily: 60, fixedDose: true },
            pediatric: { dose: 1, unit: 'mg/kg', frequency: 'Q12-24H (max 60mg/day)', maxDaily: 60 },
            neonate: { dose: 1, unit: 'mg/kg', frequency: 'Q24H', maxDaily: null },
            renalAdjust: false,
            notes: 'Asthma exacerbation: 1-2 mg/kg/day x 3-5 days. No taper needed for short course.',
            warnings: ['Hyperglycemia', 'Mood changes', 'GI upset', 'Immunosuppression']
        },
        'montelukast': {
            name: 'Montelukast (Singulair)',
            route: 'PO',
            adult: { dose: 10, unit: 'mg', frequency: 'Q24H at bedtime', maxDaily: 10, fixedDose: true },
            pediatric: { dose: 4, unit: 'mg', frequency: 'Q24H (6mo-5y: 4mg, 6-14y: 5mg)', maxDaily: 10, fixedDose: true },
            neonate: { dose: null, unit: null, frequency: null, maxDaily: null },
            renalAdjust: false,
            notes: '6-23 months: 4mg granules. 2-5 years: 4mg chewable. 6-14 years: 5mg.',
            warnings: ['Neuropsychiatric events (boxed warning)', 'Headache', 'GI upset']
        },
        'fluticasone': {
            name: 'Fluticasone (Flovent)',
            route: 'Inhaled',
            adult: { dose: 100, unit: 'mcg', frequency: 'Q12H (range 100-500 Q12H)', maxDaily: 1000, fixedDose: true },
            pediatric: { dose: 50, unit: 'mcg', frequency: 'Q12H (range 50-200 Q12H)', maxDaily: 400 },
            neonate: { dose: null, unit: null, frequency: null, maxDaily: null },
            renalAdjust: false,
            notes: 'Low dose: 88mcg BID. Medium: 220mcg BID. High: 440mcg BID.',
            warnings: ['Oral thrush', 'Hoarseness', 'Growth suppression', 'Adrenal suppression with high doses']
        },
        'caffeine-citrate': {
            name: 'Caffeine Citrate (Cafcit)',
            route: 'IV/PO',
            adult: { dose: null, unit: null, frequency: null, maxDaily: null },
            pediatric: { dose: null, unit: null, frequency: null, maxDaily: null },
            neonate: { dose: 5, unit: 'mg/kg', frequency: 'Q24H (load 20 mg/kg)', maxDaily: null },
            renalAdjust: false,
            notes: 'Apnea of prematurity. Loading: 20 mg/kg IV/PO. Maintenance: 5 mg/kg Q24H.',
            warnings: ['Tachycardia', 'GI intolerance', 'Irritability', 'Diuresis']
        },
        'surfactant': {
            name: 'Surfactant (Survanta/Curosurf)',
            route: 'Intratracheal',
            adult: { dose: null, unit: null, frequency: null, maxDaily: null },
            pediatric: { dose: null, unit: null, frequency: null, maxDaily: null },
            neonate: { dose: 100, unit: 'mg/kg', frequency: 'x1-4 doses Q6H PRN (phospholipid)', maxDaily: null },
            renalAdjust: false,
            notes: 'Beractant (Survanta): 100 mg/kg (4 mL/kg). Poractant (Curosurf): 200 mg/kg initial, 100 mg/kg repeat.',
            warnings: ['Transient bradycardia', 'O2 desaturation', 'Pulmonary hemorrhage', 'Reflux into ETT']
        },
        'racemic-epinephrine': {
            name: 'Racemic Epinephrine',
            route: 'Nebulized',
            adult: { dose: 0.5, unit: 'mL', frequency: 'Q20min PRN (2.25% solution)', maxDaily: null, fixedDose: true },
            pediatric: { dose: 0.5, unit: 'mL', frequency: 'Q20min PRN (in 3mL NS)', maxDaily: null },
            neonate: { dose: 0.25, unit: 'mL', frequency: 'Q20min PRN', maxDaily: null },
            renalAdjust: false,
            notes: 'Croup/stridor. Observe 2-4 hours post-treatment for rebound. L-epinephrine 5mL (1mg/mL) is alternative.',
            warnings: ['Rebound edema', 'Tachycardia', 'Observe post-treatment']
        },
        'palivizumab': {
            name: 'Palivizumab (Synagis)',
            route: 'IM',
            adult: { dose: null, unit: null, frequency: null, maxDaily: null },
            pediatric: { dose: 15, unit: 'mg/kg', frequency: 'Monthly during RSV season', maxDaily: null },
            neonate: { dose: 15, unit: 'mg/kg', frequency: 'Monthly during RSV season', maxDaily: null },
            renalAdjust: false,
            notes: 'RSV prophylaxis. Max 5 doses per season. Inject in anterolateral thigh.',
            warnings: ['Injection site reactions', 'Fever', 'Anaphylaxis rare']
        }
    },
    // ==========================================
    // GI MEDICATIONS
    // ==========================================
    'gi': {
        'omeprazole': {
            name: 'Omeprazole (Prilosec)',
            route: 'PO',
            adult: { dose: 20, unit: 'mg', frequency: 'Q24H (max 40mg Q12H)', maxDaily: 80, fixedDose: true },
            pediatric: { dose: 1, unit: 'mg/kg', frequency: 'Q24H (max 20mg)', maxDaily: 40 },
            neonate: { dose: 0.5, unit: 'mg/kg', frequency: 'Q24H', maxDaily: null },
            renalAdjust: false,
            notes: 'Give 30 min before breakfast. May open capsule and mix with applesauce.',
            warnings: ['C. diff risk', 'Hypomagnesemia (long-term)', 'B12 deficiency', 'Fracture risk']
        },
        'lansoprazole': {
            name: 'Lansoprazole (Prevacid)',
            route: 'PO',
            adult: { dose: 30, unit: 'mg', frequency: 'Q24H', maxDaily: 60, fixedDose: true },
            pediatric: { dose: 1, unit: 'mg/kg', frequency: 'Q24H (max 30mg)', maxDaily: 30 },
            neonate: { dose: 0.5, unit: 'mg/kg', frequency: 'Q24H', maxDaily: null },
            renalAdjust: false,
            notes: 'Solutabs can be dissolved in water. Give before meals.',
            warnings: ['C. diff risk', 'Hypomagnesemia', 'B12 deficiency', 'Drug interactions']
        },
        'ranitidine': {
            name: 'Famotidine (Pepcid)',
            route: 'IV/PO',
            adult: { dose: 20, unit: 'mg', frequency: 'Q12H (max 40mg Q12H)', maxDaily: 80, fixedDose: true },
            pediatric: { dose: 0.5, unit: 'mg/kg', frequency: 'Q12H (max 40mg/day)', maxDaily: 40 },
            neonate: { dose: 0.5, unit: 'mg/kg', frequency: 'Q24H', maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: 'No change', note: 'Standard dosing' },
                moderate: { adjust: 'Q24H', note: 'Once daily or 50% dose' },
                severe: { adjust: 'Q36-48H', note: '50% dose' },
                esrd: { adjust: 'Q48H', note: '50% dose' }
            },
            notes: 'H2 blocker. Note: Ranitidine recalled - famotidine is replacement.',
            warnings: ['Headache', 'Constipation', 'Thrombocytopenia rare']
        },
        'ondansetron': {
            name: 'Ondansetron (Zofran)',
            route: 'IV/PO',
            adult: { dose: 4, unit: 'mg', frequency: 'Q8H PRN (max 24mg/day)', maxDaily: 24, fixedDose: true },
            pediatric: { dose: 0.15, unit: 'mg/kg', frequency: 'Q8H PRN (max 4mg/dose)', maxDaily: 12 },
            neonate: { dose: 0.1, unit: 'mg/kg', frequency: 'Q12H PRN', maxDaily: null },
            renalAdjust: false,
            notes: 'ODT dissolves on tongue. <40kg: 0.15 mg/kg (max 4mg). >40kg: 4-8mg.',
            warnings: ['QT prolongation (dose-dependent)', 'Headache', 'Constipation', 'Serotonin syndrome']
        },
        'metoclopramide': {
            name: 'Metoclopramide (Reglan)',
            route: 'IV/PO',
            adult: { dose: 10, unit: 'mg', frequency: 'Q6-8H (max 12 weeks)', maxDaily: 40, fixedDose: true },
            pediatric: { dose: 0.1, unit: 'mg/kg', frequency: 'Q6-8H (max 0.5 mg/kg/day)', maxDaily: 40 },
            neonate: { dose: 0.1, unit: 'mg/kg', frequency: 'Q6-8H', maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: 'No change', note: 'Standard dosing' },
                moderate: { adjust: '50% dose', note: 'Half dose' },
                severe: { adjust: '50% dose', note: 'Half dose' },
                esrd: { adjust: '50% dose', note: 'Half dose' }
            },
            notes: 'Prokinetic. Give 30 min before meals. Limit use to 12 weeks (TD risk).',
            warnings: ['Extrapyramidal symptoms', 'Tardive dyskinesia (boxed warning)', 'Drowsiness', 'QT prolongation']
        },
        'erythromycin-prokinetic': {
            name: 'Erythromycin (Prokinetic)',
            route: 'IV/PO',
            adult: { dose: 250, unit: 'mg', frequency: 'Q6H before meals', maxDaily: 1000, fixedDose: true },
            pediatric: { dose: 3, unit: 'mg/kg', frequency: 'Q6-8H before feeds', maxDaily: null },
            neonate: { dose: 3, unit: 'mg/kg', frequency: 'Q6-8H', maxDaily: null },
            renalAdjust: false,
            notes: 'Low-dose for motility. Tachyphylaxis develops in 2-4 weeks.',
            warnings: ['QT prolongation', 'GI upset', 'Pyloric stenosis risk in neonates', 'Drug interactions']
        },
        'lactulose': {
            name: 'Lactulose (Enulose)',
            route: 'PO/PR',
            adult: { dose: 15, unit: 'mL', frequency: 'Q8-12H (titrate to 2-3 BM/day)', maxDaily: 60, fixedDose: true },
            pediatric: { dose: 1, unit: 'mL/kg', frequency: 'Q8H (max 40mL/dose)', maxDaily: 120 },
            neonate: { dose: 2.5, unit: 'mL', frequency: 'Q8-12H', maxDaily: null },
            renalAdjust: false,
            notes: 'Hepatic encephalopathy: titrate to 2-3 soft stools/day. May cause gas/cramping initially.',
            warnings: ['Flatulence', 'Cramping', 'Electrolyte imbalances with overuse']
        },
        'polyethylene-glycol': {
            name: 'Polyethylene Glycol (Miralax)',
            route: 'PO',
            adult: { dose: 17, unit: 'g', frequency: 'Q24H in 8oz water', maxDaily: 17, fixedDose: true },
            pediatric: { dose: 0.5, unit: 'g/kg', frequency: 'Q24H (max 17g)', maxDaily: 17 },
            neonate: { dose: null, unit: null, frequency: null, maxDaily: null },
            renalAdjust: false,
            notes: 'Disimpaction: 1-1.5 g/kg/day x 3 days. Maintenance: 0.4-0.8 g/kg/day.',
            warnings: ['Bloating', 'Nausea', 'Electrolyte imbalances with excessive use']
        },
        'docusate': {
            name: 'Docusate (Colace)',
            route: 'PO',
            adult: { dose: 100, unit: 'mg', frequency: 'Q12-24H', maxDaily: 400, fixedDose: true },
            pediatric: { dose: 5, unit: 'mg/kg', frequency: 'Q24H (divided if >50mg)', maxDaily: 400 },
            neonate: { dose: 5, unit: 'mg/kg', frequency: 'Q24H', maxDaily: null },
            renalAdjust: false,
            notes: 'Stool softener. 3-12y: 50-150mg/day. >12y: 100-300mg/day.',
            warnings: ['Cramping', 'Diarrhea', 'May interfere with mineral oil absorption']
        },
        'glycerin-suppository': {
            name: 'Glycerin Suppository',
            route: 'PR',
            adult: { dose: 1, unit: 'adult supp', frequency: 'Q24H PRN', maxDaily: null, fixedDose: true },
            pediatric: { dose: 1, unit: 'infant/child supp', frequency: 'Q24H PRN', maxDaily: null },
            neonate: { dose: 0.5, unit: 'infant supp', frequency: 'Q24H PRN', maxDaily: null },
            renalAdjust: false,
            notes: 'Infant suppository or cut adult suppository for neonates. Works in 15-30 min.',
            warnings: ['Rectal irritation', 'Dependence with regular use']
        },
        'sucralfate': {
            name: 'Sucralfate (Carafate)',
            route: 'PO',
            adult: { dose: 1, unit: 'g', frequency: 'QID (1hr before meals and HS)', maxDaily: 4, fixedDose: true },
            pediatric: { dose: 40, unit: 'mg/kg', frequency: 'QID (max 1g/dose)', maxDaily: 4000 },
            neonate: { dose: 40, unit: 'mg/kg', frequency: 'QID', maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: 'No change', note: 'Standard dosing' },
                moderate: { adjust: 'Use with caution', note: 'Aluminum accumulation risk' },
                severe: { adjust: 'Avoid', note: 'Aluminum toxicity risk' },
                esrd: { adjust: 'Avoid', note: 'Contraindicated' }
            },
            notes: 'Give on empty stomach. Separate from other meds by 2 hours.',
            warnings: ['Constipation', 'Aluminum accumulation in renal failure', 'Drug binding']
        },
        'ursodiol': {
            name: 'Ursodiol (Actigall/Urso)',
            route: 'PO',
            adult: { dose: 300, unit: 'mg', frequency: 'Q12H (10-15 mg/kg/day)', maxDaily: null, fixedDose: true },
            pediatric: { dose: 10, unit: 'mg/kg', frequency: 'Q12H (TPN cholestasis: 30 mg/kg/day)', maxDaily: null },
            neonate: { dose: 10, unit: 'mg/kg', frequency: 'Q12H', maxDaily: null },
            renalAdjust: false,
            notes: 'TPN cholestasis: 20-30 mg/kg/day divided BID-TID. Cystic fibrosis: 20 mg/kg/day.',
            warnings: ['Diarrhea', 'May not work with calcified stones', 'Hepatotoxicity rare']
        }
    },
    // ==========================================
    // PAIN/SEDATION MEDICATIONS
    // ==========================================
    'pain-sedation': {
        'morphine': {
            name: 'Morphine',
            route: 'IV/PO',
            adult: { dose: 2, unit: 'mg', frequency: 'Q2-4H PRN (IV)', maxDaily: null, fixedDose: true },
            pediatric: { dose: 0.1, unit: 'mg/kg', frequency: 'Q2-4H PRN (max 15mg/dose)', maxDaily: null },
            neonate: { dose: 0.05, unit: 'mg/kg', frequency: 'Q4-6H PRN', maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: '75% dose', note: 'Reduce dose' },
                moderate: { adjust: '50% dose', note: 'Half dose' },
                severe: { adjust: '25% dose', note: 'Prolonged effect' },
                esrd: { adjust: 'Avoid', note: 'Metabolite accumulation' }
            },
            notes: 'IV:PO ratio = 1:3. Continuous: 0.01-0.05 mg/kg/hr. NAS protocol varies.',
            warnings: ['Respiratory depression', 'Hypotension', 'Constipation', 'Urinary retention', 'Active metabolite in renal failure']
        },
        'fentanyl': {
            name: 'Fentanyl',
            route: 'IV/Intranasal',
            adult: { dose: 50, unit: 'mcg', frequency: 'Q1-2H PRN', maxDaily: null, fixedDose: true },
            pediatric: { dose: 1, unit: 'mcg/kg', frequency: 'Q1-2H PRN (max 50mcg/dose)', maxDaily: null },
            neonate: { dose: 1, unit: 'mcg/kg', frequency: 'Q2-4H PRN', maxDaily: null },
            renalAdjust: false,
            notes: 'Continuous: 1-5 mcg/kg/hr. Intranasal: 1.5-2 mcg/kg. Chest wall rigidity at high doses.',
            warnings: ['Respiratory depression', 'Chest wall rigidity', 'Bradycardia']
        },
        'hydromorphone': {
            name: 'Hydromorphone (Dilaudid)',
            route: 'IV/PO',
            adult: { dose: 0.5, unit: 'mg', frequency: 'Q3-4H PRN (IV)', maxDaily: null, fixedDose: true },
            pediatric: { dose: 0.015, unit: 'mg/kg', frequency: 'Q3-4H PRN (max 2mg/dose)', maxDaily: null },
            neonate: { dose: 0.01, unit: 'mg/kg', frequency: 'Q4-6H PRN', maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: '75% dose', note: 'Reduce dose' },
                moderate: { adjust: '50% dose', note: 'Half dose, extend interval' },
                severe: { adjust: '25-50% dose', note: 'Significant reduction' },
                esrd: { adjust: '25% dose', note: 'Extend interval' }
            },
            notes: 'IV:PO = 1:4. 5-7x more potent than morphine.',
            warnings: ['Respiratory depression', 'Hypotension', 'Constipation']
        },
        'acetaminophen': {
            name: 'Acetaminophen (Tylenol)',
            route: 'IV/PO/PR',
            adult: { dose: 650, unit: 'mg', frequency: 'Q4-6H (max 4g/day)', maxDaily: 4000, fixedDose: true },
            pediatric: { dose: 15, unit: 'mg/kg', frequency: 'Q4-6H (max 75 mg/kg/day)', maxDaily: 4000 },
            neonate: { dose: 10, unit: 'mg/kg', frequency: 'Q6-8H', maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: 'No change', note: 'Standard dosing' },
                moderate: { adjust: 'Q6H', note: 'Extended interval' },
                severe: { adjust: 'Q8H', note: 'Extended interval' },
                esrd: { adjust: 'Q8H', note: 'Extended interval' }
            },
            notes: 'IV: 10-15 mg/kg Q4-6H (≥2yo) or 7.5 mg/kg (neonates). Rectal absorption variable.',
            warnings: ['Hepatotoxicity in overdose', 'Reduce dose in liver disease']
        },
        'ibuprofen': {
            name: 'Ibuprofen (Advil/Motrin)',
            route: 'PO',
            adult: { dose: 400, unit: 'mg', frequency: 'Q6-8H (max 3200mg/day)', maxDaily: 3200, fixedDose: true },
            pediatric: { dose: 10, unit: 'mg/kg', frequency: 'Q6-8H (max 40 mg/kg/day)', maxDaily: 2400 },
            neonate: { dose: null, unit: null, frequency: null, maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: 'No change', note: 'Monitor renal function' },
                moderate: { adjust: 'Use with caution', note: 'Monitor closely' },
                severe: { adjust: 'Avoid', note: 'Worsens renal function' },
                esrd: { adjust: 'Avoid', note: 'Not dialyzable' }
            },
            notes: 'Anti-inflammatory: 30-50 mg/kg/day. Antipyretic: 5-10 mg/kg/dose.',
            warnings: ['GI bleeding', 'Renal impairment', 'Platelet dysfunction', 'Avoid in dehydration']
        },
        'ketorolac': {
            name: 'Ketorolac (Toradol)',
            route: 'IV/IM',
            adult: { dose: 30, unit: 'mg', frequency: 'Q6H (max 5 days)', maxDaily: 120, fixedDose: true },
            pediatric: { dose: 0.5, unit: 'mg/kg', frequency: 'Q6H (max 30mg/dose, 5 days)', maxDaily: 120 },
            neonate: { dose: null, unit: null, frequency: null, maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: '15mg Q6H', note: 'Reduced dose' },
                moderate: { adjust: 'Avoid', note: 'Not recommended' },
                severe: { adjust: 'Contraindicated', note: 'Do not use' },
                esrd: { adjust: 'Contraindicated', note: 'Do not use' }
            },
            notes: 'Limit to 5 days. 0.5 mg/kg IV Q6H (max 15mg if <50kg, 30mg if >50kg).',
            warnings: ['GI bleeding', 'Renal impairment', 'Bleeding risk', 'Not for chronic pain']
        },
        'dexmedetomidine': {
            name: 'Dexmedetomidine (Precedex)',
            route: 'IV infusion',
            adult: { dose: 0.5, unit: 'mcg/kg/hr', frequency: 'Continuous (range 0.2-1.5)', maxDaily: null, fixedDose: false },
            pediatric: { dose: 0.5, unit: 'mcg/kg/hr', frequency: 'Continuous (range 0.2-1.5)', maxDaily: null },
            neonate: { dose: 0.3, unit: 'mcg/kg/hr', frequency: 'Continuous (range 0.2-0.5)', maxDaily: null },
            renalAdjust: false,
            notes: 'Loading: 0.5-1 mcg/kg over 10 min (often omitted). No respiratory depression.',
            warnings: ['Bradycardia', 'Hypotension', 'Hypertension with loading dose']
        },
        'ketamine': {
            name: 'Ketamine',
            route: 'IV/IM',
            adult: { dose: 1, unit: 'mg/kg', frequency: 'IV bolus for sedation (0.5-2 mg/kg)', maxDaily: null, fixedDose: false },
            pediatric: { dose: 1, unit: 'mg/kg', frequency: 'IV bolus (IM: 4-5 mg/kg)', maxDaily: null },
            neonate: { dose: 0.5, unit: 'mg/kg', frequency: 'IV bolus', maxDaily: null },
            renalAdjust: false,
            notes: 'Procedural sedation: 1-2 mg/kg IV. Continuous: 0.5-2 mg/kg/hr. Give with glycopyrrolate.',
            warnings: ['Laryngospasm', 'Emergence reactions', 'Increased secretions', 'Increased ICP (controversial)']
        },
        'chloral-hydrate': {
            name: 'Chloral Hydrate',
            route: 'PO/PR',
            adult: { dose: null, unit: null, frequency: null, maxDaily: null },
            pediatric: { dose: 50, unit: 'mg/kg', frequency: 'x1 (max 100 mg/kg or 2g)', maxDaily: 2000 },
            neonate: { dose: 25, unit: 'mg/kg', frequency: 'x1 for procedures', maxDaily: null },
            renalAdjust: false,
            notes: 'Procedural sedation. Onset 15-30 min. Duration 1-2 hours. Monitor SpO2.',
            warnings: ['Respiratory depression', 'Paradoxical excitation', 'GI irritation', 'Long half-life of metabolites']
        }
    },
    // ==========================================
    // ELECTROLYTES & VITAMINS
    // ==========================================
    'electrolytes': {
        'potassium-chloride': {
            name: 'Potassium Chloride (KCl)',
            route: 'IV/PO',
            adult: { dose: 20, unit: 'mEq', frequency: 'Q2-4H PRN (max 10 mEq/hr peripheral)', maxDaily: 200, fixedDose: true },
            pediatric: { dose: 0.5, unit: 'mEq/kg', frequency: 'Q4-6H PRN (max 1 mEq/kg/dose)', maxDaily: null },
            neonate: { dose: 0.5, unit: 'mEq/kg', frequency: 'Q6-8H PRN', maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: 'Monitor K+', note: 'Use with caution' },
                moderate: { adjust: 'Reduce dose', note: 'Monitor closely' },
                severe: { adjust: 'Avoid unless hypokalemic', note: 'High risk' },
                esrd: { adjust: 'Avoid unless hypokalemic', note: 'Use with extreme caution' }
            },
            notes: 'IV: max 0.5 mEq/kg/hr (1 mEq/kg/hr with monitoring). Max concentration peripheral: 40 mEq/L.',
            warnings: ['Hyperkalemia', 'Cardiac arrhythmias', 'Tissue necrosis if extravasated', 'GI irritation (PO)']
        },
        'calcium-gluconate': {
            name: 'Calcium Gluconate',
            route: 'IV',
            adult: { dose: 1, unit: 'g', frequency: 'Over 10-20 min PRN', maxDaily: null, fixedDose: true },
            pediatric: { dose: 100, unit: 'mg/kg', frequency: 'Over 10-30 min (max 3g)', maxDaily: null },
            neonate: { dose: 100, unit: 'mg/kg', frequency: 'Over 10-30 min', maxDaily: null },
            renalAdjust: false,
            notes: '10% solution = 100 mg/mL = 9.3 mg elemental Ca/mL. Cardiac arrest: 60 mg/kg.',
            warnings: ['Bradycardia with rapid infusion', 'Tissue necrosis if extravasated', 'Incompatible with bicarb', 'Digoxin toxicity potentiation']
        },
        'calcium-chloride': {
            name: 'Calcium Chloride',
            route: 'IV (central preferred)',
            adult: { dose: 500, unit: 'mg', frequency: 'Over 10-20 min PRN', maxDaily: null, fixedDose: true },
            pediatric: { dose: 20, unit: 'mg/kg', frequency: 'Over 10-30 min (max 1g)', maxDaily: null },
            neonate: { dose: 20, unit: 'mg/kg', frequency: 'Over 10-30 min', maxDaily: null },
            renalAdjust: false,
            notes: '10% = 100 mg/mL = 27 mg elemental Ca/mL. 3x more elemental Ca than gluconate.',
            warnings: ['Severe tissue necrosis if extravasated', 'Central line preferred', 'Bradycardia', 'Hypercalcemia']
        },
        'magnesium-sulfate': {
            name: 'Magnesium Sulfate',
            route: 'IV',
            adult: { dose: 2, unit: 'g', frequency: 'Over 1-2 hours PRN', maxDaily: null, fixedDose: true },
            pediatric: { dose: 25, unit: 'mg/kg', frequency: 'Over 20 min (max 2g)', maxDaily: null },
            neonate: { dose: 25, unit: 'mg/kg', frequency: 'Over 20-30 min', maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: 'No change', note: 'Standard dosing' },
                moderate: { adjust: '50% dose', note: 'Reduce dose' },
                severe: { adjust: '25% dose', note: 'Use with caution' },
                esrd: { adjust: 'Avoid', note: 'Use only if critical' }
            },
            notes: 'Asthma: 25-75 mg/kg. Torsades: 25-50 mg/kg. Hypomagnesemia: 25-50 mg/kg.',
            warnings: ['Hypotension', 'Respiratory depression', 'Heart block', 'Flushing']
        },
        'phosphorus': {
            name: 'Phosphorus (K-Phos/Na-Phos)',
            route: 'IV/PO',
            adult: { dose: 0.32, unit: 'mmol/kg', frequency: 'Over 6 hours', maxDaily: null, fixedDose: false },
            pediatric: { dose: 0.32, unit: 'mmol/kg', frequency: 'Over 6 hours', maxDaily: null },
            neonate: { dose: 0.32, unit: 'mmol/kg', frequency: 'Over 6 hours', maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: 'Use with caution', note: 'Monitor levels' },
                moderate: { adjust: '50% dose', note: 'Monitor closely' },
                severe: { adjust: 'Avoid IV', note: 'Hyperphosphatemia risk' },
                esrd: { adjust: 'Avoid', note: 'Contraindicated' }
            },
            notes: 'Moderate deficit: 0.16-0.32 mmol/kg. Severe: 0.32-0.64 mmol/kg. Choose K-Phos vs Na-Phos based on K+ level.',
            warnings: ['Hypocalcemia', 'Tissue calcification', 'Hyperkalemia (K-Phos)', 'Infuse over 6 hours']
        },
        'vitamin-d': {
            name: 'Vitamin D (Ergocalciferol/Cholecalciferol)',
            route: 'PO',
            adult: { dose: 1000, unit: 'IU', frequency: 'Q24H (deficiency: 50000 IU weekly)', maxDaily: 4000, fixedDose: true },
            pediatric: { dose: 400, unit: 'IU', frequency: 'Q24H (deficiency: 2000-4000 IU/day)', maxDaily: 4000 },
            neonate: { dose: 400, unit: 'IU', frequency: 'Q24H', maxDaily: 1000 },
            renalAdjust: false,
            notes: 'Prophylaxis: 400 IU/day. Treatment varies by severity. Cholecalciferol (D3) preferred.',
            warnings: ['Hypercalcemia with overdose', 'Hypercalciuria', 'Monitor Ca and 25-OH vitamin D levels']
        },
        'iron-supplement': {
            name: 'Iron (Ferrous Sulfate)',
            route: 'PO',
            adult: { dose: 325, unit: 'mg', frequency: 'Q8-12H (65mg elemental/tab)', maxDaily: 975, fixedDose: true },
            pediatric: { dose: 3, unit: 'mg/kg elemental', frequency: 'Q24H (treatment: 6 mg/kg/day divided)', maxDaily: null },
            neonate: { dose: 2, unit: 'mg/kg elemental', frequency: 'Q24H', maxDaily: null },
            renalAdjust: false,
            notes: 'Ferrous sulfate is 20% elemental iron. Give with vitamin C. Separate from antacids.',
            warnings: ['GI upset', 'Constipation', 'Dark stools', 'Accidental overdose dangerous in children']
        },
        'zinc-supplement': {
            name: 'Zinc Sulfate',
            route: 'PO',
            adult: { dose: 220, unit: 'mg', frequency: 'Q24H (50mg elemental)', maxDaily: 440, fixedDose: true },
            pediatric: { dose: 1, unit: 'mg/kg elemental', frequency: 'Q24H (max 50mg)', maxDaily: 50 },
            neonate: { dose: 0.5, unit: 'mg/kg elemental', frequency: 'Q24H', maxDaily: null },
            renalAdjust: false,
            notes: 'Diarrhea: 10-20mg elemental daily x 10-14 days. Zinc sulfate is 23% elemental zinc.',
            warnings: ['Nausea', 'Copper deficiency with prolonged use', 'GI upset']
        }
    },
    // ==========================================
    // OTHER PEDIATRIC MEDICATIONS
    // ==========================================
    'other-pediatric': {
        'hydrocortisone': {
            name: 'Hydrocortisone (Solu-Cortef)',
            route: 'IV/PO',
            adult: { dose: 100, unit: 'mg', frequency: 'Q8H (stress dosing)', maxDaily: 300, fixedDose: true },
            pediatric: { dose: 2, unit: 'mg/kg', frequency: 'Q6-8H (stress: 50-100 mg/m²/day)', maxDaily: 300 },
            neonate: { dose: 1, unit: 'mg/kg', frequency: 'Q8H (stress: 25 mg/m²/day)', maxDaily: null },
            renalAdjust: false,
            notes: 'Physiologic replacement: 8-10 mg/m²/day. Stress: 50-100 mg/m²/day divided Q6-8H.',
            warnings: ['Hyperglycemia', 'Hypertension', 'Immunosuppression', 'Adrenal suppression', 'Growth suppression']
        },
        'methylprednisolone': {
            name: 'Methylprednisolone (Solu-Medrol)',
            route: 'IV',
            adult: { dose: 125, unit: 'mg', frequency: 'Q6-8H', maxDaily: 1000, fixedDose: true },
            pediatric: { dose: 1, unit: 'mg/kg', frequency: 'Q6H (pulse: 30 mg/kg x 3 days)', maxDaily: 1000 },
            neonate: { dose: 0.5, unit: 'mg/kg', frequency: 'Q12H', maxDaily: null },
            renalAdjust: false,
            notes: 'Pulse therapy: 30 mg/kg (max 1g) daily x 3 days. Anti-inflammatory: 0.5-1.7 mg/kg/day.',
            warnings: ['Hyperglycemia', 'Hypertension', 'Immunosuppression', 'GI bleeding', 'Mood changes']
        },
        'dexamethasone': {
            name: 'Dexamethasone',
            route: 'IV/PO',
            adult: { dose: 10, unit: 'mg', frequency: 'Q6H (varies by indication)', maxDaily: 40, fixedDose: true },
            pediatric: { dose: 0.15, unit: 'mg/kg', frequency: 'Q6H (meningitis: 0.15 mg/kg Q6H x 4 days)', maxDaily: 40 },
            neonate: { dose: 0.15, unit: 'mg/kg', frequency: 'Q12H (BPD protocol varies)', maxDaily: null },
            renalAdjust: false,
            notes: 'Cerebral edema: 1-2 mg/kg load, then 1-1.5 mg/kg/day. Airway edema: 0.5-2 mg/kg.',
            warnings: ['Hyperglycemia', 'Hypertension', 'GI bleeding', 'Immunosuppression', 'Adrenal suppression']
        },
        'enoxaparin': {
            name: 'Enoxaparin (Lovenox)',
            route: 'SC',
            adult: { dose: 1, unit: 'mg/kg', frequency: 'Q12H (treatment dose)', maxDaily: null, fixedDose: false },
            pediatric: { dose: 1, unit: 'mg/kg', frequency: 'Q12H (<2mo: 1.5 mg/kg Q12H)', maxDaily: null },
            neonate: { dose: 1.5, unit: 'mg/kg', frequency: 'Q12H', maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: 'No change', note: 'Standard dosing, monitor anti-Xa' },
                moderate: { adjust: 'Monitor anti-Xa', note: 'May need adjustment' },
                severe: { adjust: '1 mg/kg Q24H', note: 'Once daily treatment dose' },
                esrd: { adjust: 'Consider UFH', note: 'Enoxaparin not recommended' }
            },
            notes: 'Prophylaxis: 0.5 mg/kg Q12H. Target anti-Xa: 0.5-1.0 (treatment), 0.1-0.3 (prophylaxis).',
            warnings: ['Bleeding', 'Thrombocytopenia (HIT)', 'Osteoporosis with long-term use']
        },
        'heparin': {
            name: 'Heparin (UFH)',
            route: 'IV',
            adult: { dose: 80, unit: 'units/kg', frequency: 'Bolus then 18 units/kg/hr', maxDaily: null, fixedDose: false },
            pediatric: { dose: 75, unit: 'units/kg', frequency: 'Bolus then 20 units/kg/hr (<1yr: 28 units/kg/hr)', maxDaily: null },
            neonate: { dose: 75, unit: 'units/kg', frequency: 'Bolus then 28 units/kg/hr', maxDaily: null },
            renalAdjust: false,
            notes: 'Target aPTT 60-85 sec or anti-Xa 0.35-0.7. Flush: 10 units/mL.',
            warnings: ['Bleeding', 'HIT', 'Osteoporosis with long-term use', 'Hyperkalemia']
        },
        'insulin-regular': {
            name: 'Regular Insulin',
            route: 'IV/SC',
            adult: { dose: 0.1, unit: 'units/kg/hr', frequency: 'Continuous (DKA)', maxDaily: null, fixedDose: false },
            pediatric: { dose: 0.1, unit: 'units/kg/hr', frequency: 'Continuous (DKA)', maxDaily: null },
            neonate: { dose: 0.05, unit: 'units/kg/hr', frequency: 'Continuous', maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: 'No change', note: 'Standard dosing' },
                moderate: { adjust: 'May need reduction', note: 'Reduced clearance' },
                severe: { adjust: 'Reduce dose', note: 'Prolonged effect' },
                esrd: { adjust: 'Reduce by 50%', note: 'Significant reduction needed' }
            },
            notes: 'DKA: 0.1 units/kg/hr (no bolus in peds). Hyperkalemia: 0.1 units/kg with D25W.',
            warnings: ['Hypoglycemia', 'Hypokalemia', 'Cerebral edema risk in DKA']
        },
        'octreotide': {
            name: 'Octreotide (Sandostatin)',
            route: 'IV/SC',
            adult: { dose: 50, unit: 'mcg', frequency: 'Q8H SC or continuous IV', maxDaily: null, fixedDose: true },
            pediatric: { dose: 1, unit: 'mcg/kg', frequency: 'Q6-12H or continuous (1-10 mcg/kg/hr)', maxDaily: null },
            neonate: { dose: 1, unit: 'mcg/kg', frequency: 'Q6-12H (chylothorax: 1-10 mcg/kg/hr)', maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: 'No change', note: 'Standard dosing' },
                moderate: { adjust: 'No change', note: 'Standard dosing' },
                severe: { adjust: '50% dose', note: 'Half dose' },
                esrd: { adjust: '50% dose', note: 'Half dose' }
            },
            notes: 'GI bleeding: 1-5 mcg/kg/hr. Chylothorax: 0.5-10 mcg/kg/hr. Hyperinsulinism: 5-20 mcg/kg/day.',
            warnings: ['Hyperglycemia or hypoglycemia', 'Bradycardia', 'GI upset', 'Cholelithiasis with long-term use']
        },
        'desmopressin': {
            name: 'Desmopressin (DDAVP)',
            route: 'IV/SC/Intranasal/PO',
            adult: { dose: 0.3, unit: 'mcg/kg', frequency: 'IV for bleeding (max 20mcg)', maxDaily: null, fixedDose: false },
            pediatric: { dose: 0.3, unit: 'mcg/kg', frequency: 'IV for bleeding (max 20mcg)', maxDaily: null },
            neonate: { dose: 0.1, unit: 'mcg/kg', frequency: 'IV (central DI)', maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: 'No change', note: 'Standard dosing' },
                moderate: { adjust: 'Use with caution', note: 'Hyponatremia risk' },
                severe: { adjust: 'Avoid', note: 'Fluid retention' },
                esrd: { adjust: 'Avoid', note: 'Contraindicated' }
            },
            notes: 'Central DI: 0.1-0.4 mcg IV Q12-24H or 5-20 mcg intranasal. Enuresis: 0.2-0.6 mg PO HS.',
            warnings: ['Hyponatremia/water intoxication', 'Seizures', 'Restrict fluids with intranasal']
        },
        'acyclovir': {
            name: 'Acyclovir (Zovirax)',
            route: 'IV/PO',
            adult: { dose: 10, unit: 'mg/kg', frequency: 'Q8H IV (HSV encephalitis: 10-15 mg/kg)', maxDaily: null, fixedDose: false },
            pediatric: { dose: 10, unit: 'mg/kg', frequency: 'Q8H IV (HSV: 20 mg/kg Q8H)', maxDaily: null },
            neonate: { dose: 20, unit: 'mg/kg', frequency: 'Q8H IV x 21 days (HSV)', maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: 'Q12H', note: 'Extended interval' },
                moderate: { adjust: 'Q12-24H', note: 'Extended interval' },
                severe: { adjust: 'Q24H', note: 'Once daily' },
                esrd: { adjust: '50% dose post-HD', note: 'Give after dialysis' }
            },
            notes: 'Neonatal HSV: 20 mg/kg Q8H x 21 days. Ensure adequate hydration. Infuse over 1 hour.',
            warnings: ['Nephrotoxicity (crystalluria)', 'Neurotoxicity in renal failure', 'Adequate hydration required', 'Phlebitis']
        },
        'fluconazole-peds': {
            name: 'Fluconazole (Pediatric)',
            route: 'IV/PO',
            adult: { dose: 400, unit: 'mg', frequency: 'Q24H (load 800mg)', maxDaily: 800, fixedDose: true },
            pediatric: { dose: 6, unit: 'mg/kg', frequency: 'Q24H (load 12 mg/kg)', maxDaily: 400 },
            neonate: { dose: 12, unit: 'mg/kg', frequency: 'Q24-72H based on GA/PNA', maxDaily: null },
            renalAdjust: true,
            renalDosing: {
                mild: { adjust: 'No change', note: 'Standard dosing' },
                moderate: { adjust: '50% dose', note: 'Half dose' },
                severe: { adjust: '50% dose', note: 'Half dose' },
                esrd: { adjust: '100% dose post-HD', note: 'Full dose after dialysis' }
            },
            notes: 'Neonatal dosing by GA/PNA. Prophylaxis: 3-6 mg/kg. Invasive: 12 mg/kg.',
            warnings: ['Hepatotoxicity', 'QT prolongation', 'Drug interactions']
        },
        'vitamin-k': {
            name: 'Vitamin K (Phytonadione)',
            route: 'IV/IM/SC/PO',
            adult: { dose: 10, unit: 'mg', frequency: 'x1 (warfarin reversal)', maxDaily: null, fixedDose: true },
            pediatric: { dose: 0.5, unit: 'mg', frequency: 'x1 (prophylaxis: 1mg IM at birth)', maxDaily: null },
            neonate: { dose: 1, unit: 'mg', frequency: 'x1 IM at birth', maxDaily: null },
            renalAdjust: false,
            notes: 'Prophylaxis: 1mg IM at birth. Hemorrhage: 1-5 mg IV slow. IV rate max 1 mg/min.',
            warnings: ['Anaphylaxis (IV)', 'Give IV slowly over 15-30 min', 'Flushing']
        }
    }
};

// ==========================================
// Brand Name Aliases for Medication Search
// ==========================================
const medicationAliases = {
    // IV Common Antibiotics
    'vancomycin': ['vancocin', 'vanc'],
    'piperacillin-tazobactam': ['zosyn', 'pip-tazo', 'tazocin'],
    'ceftriaxone': ['rocephin'],
    'meropenem': ['merrem'],
    'cefepime': ['maxipime'],
    'ampicillin-sulbactam': ['unasyn'],
    'cefazolin': ['ancef', 'kefzol'],
    'ceftazidime': ['fortaz', 'tazicef'],
    'aztreonam': ['azactam'],
    'linezolid': ['zyvox'],
    'daptomycin': ['cubicin'],

    // Aminoglycosides
    'gentamicin': ['garamycin'],
    'tobramycin': ['tobi', 'nebcin'],
    'amikacin': ['amikin'],

    // Pediatric Oral
    'amoxicillin': ['amoxil', 'trimox'],
    'amoxicillin-clavulanate': ['augmentin'],
    'azithromycin': ['zithromax', 'zpack', 'z-pack'],
    'cephalexin': ['keflex'],
    'clindamycin': ['cleocin'],
    'metronidazole': ['flagyl'],
    'sulfamethoxazole-trimethoprim': ['bactrim', 'septra', 'tmp-smx', 'cotrimoxazole'],

    // ICU
    'colistin': ['colistimethate', 'colomycin'],
    'micafungin': ['mycamine'],
    'caspofungin': ['cancidas'],
    'voriconazole': ['vfend'],
    'acyclovir': ['zovirax'],
    'ganciclovir': ['cytovene'],
    'tigecycline': ['tygacil'],
    'polymyxin-b': ['polymyxin'],
    'fluconazole': ['diflucan'],
    'amphotericin-b': ['ambisome', 'abelcet', 'fungizone'],
    'liposomal-amphotericin': ['ambisome'],

    // General Ward
    'nitrofurantoin': ['macrobid', 'macrodantin'],
    'ciprofloxacin-po': ['cipro'],
    'levofloxacin-po': ['levaquin'],
    'cefuroxime': ['ceftin', 'zinacef'],
    'cefpodoxime': ['vantin'],
    'erythromycin': ['ery-tab', 'erythrocin'],
    'clarithromycin': ['biaxin'],

    // Antiseizure
    'levetiracetam': ['keppra'],
    'phenytoin': ['dilantin'],
    'fosphenytoin': ['cerebyx'],
    'phenobarbital': ['luminal'],
    'valproic-acid': ['depakote', 'depakene', 'epilim'],
    'lacosamide': ['vimpat'],
    'carbamazepine': ['tegretol', 'carbatrol'],
    'oxcarbazepine': ['trileptal'],
    'topiramate': ['topamax'],
    'clobazam': ['onfi', 'frisium'],
    'clonazepam': ['klonopin', 'rivotril'],
    'diazepam': ['valium', 'diastat'],
    'lorazepam': ['ativan'],
    'midazolam': ['versed'],
    'vigabatrin': ['sabril'],
    'acth': ['acthar', 'h.p. acthar', 'cortrosyn'],

    // Nephrology
    'furosemide': ['lasix'],
    'bumetanide': ['bumex'],
    'hydrochlorothiazide': ['hctz', 'microzide'],
    'spironolactone': ['aldactone'],
    'metolazone': ['zaroxolyn'],
    'amlodipine': ['norvasc'],
    'lisinopril': ['prinivil', 'zestril'],
    'enalapril': ['vasotec'],
    'losartan': ['cozaar'],
    'sodium-bicarbonate': ['sodium bicarb', 'nahco3', 'bicarb'],
    'sodium-polystyrene': ['kayexalate', 'sps'],
    'patiromer': ['veltassa'],
    'sevelamer': ['renagel', 'renvela'],
    'calcitriol': ['rocaltrol'],
    'darbepoetin': ['aranesp'],
    'epoetin-alfa': ['epogen', 'procrit', 'epo'],

    // Cardiac
    'digoxin': ['lanoxin'],
    'dopamine': ['intropin'],
    'dobutamine': ['dobutrex'],
    'epinephrine': ['adrenaline', 'epi'],
    'norepinephrine': ['levophed', 'noradrenaline', 'norepi'],
    'milrinone': ['primacor'],
    'propranolol': ['inderal'],
    'atenolol': ['tenormin'],
    'esmolol': ['brevibloc'],
    'labetalol': ['trandate', 'normodyne'],
    'hydralazine': ['apresoline'],
    'nifedipine': ['procardia', 'adalat'],
    'nicardipine': ['cardene'],
    'adenosine': ['adenocard'],
    'amiodarone': ['cordarone', 'pacerone'],
    'atropine': ['atropen'],
    'captopril': ['capoten'],
    'sildenafil': ['viagra', 'revatio'],
    'prostaglandin-e1': ['pge1', 'alprostadil', 'prostin vr'],
    'indomethacin': ['indocin'],
    'ibuprofen-lysine': ['neoprofen'],

    // Respiratory
    'albuterol': ['ventolin', 'proventil', 'proair', 'salbutamol'],
    'ipratropium': ['atrovent'],
    'budesonide-neb': ['pulmicort'],
    'dexamethasone': ['decadron'],
    'prednisolone': ['prelone', 'orapred'],
    'prednisone': ['deltasone', 'rayos'],
    'methylprednisolone': ['solu-medrol', 'medrol', 'depo-medrol'],
    'montelukast': ['singulair'],
    'fluticasone': ['flovent', 'flonase'],
    'caffeine-citrate': ['cafcit'],
    'surfactant': ['survanta', 'curosurf', 'infasurf'],
    'racemic-epinephrine': ['racepinephrine', 's2'],
    'palivizumab': ['synagis'],

    // GI
    'omeprazole': ['prilosec'],
    'lansoprazole': ['prevacid'],
    'famotidine': ['pepcid'],
    'ranitidine': ['zantac'],
    'ondansetron': ['zofran'],
    'metoclopramide': ['reglan'],
    'erythromycin-gi': ['eryped'],
    'lactulose': ['enulose', 'kristalose'],
    'polyethylene-glycol': ['miralax', 'glycolax', 'peg'],
    'docusate': ['colace'],
    'glycerin': ['fleet glycerin'],
    'sucralfate': ['carafate'],
    'ursodiol': ['actigall', 'urso'],

    // Pain/Sedation
    'morphine': ['ms contin', 'roxanol'],
    'fentanyl': ['sublimaze', 'duragesic'],
    'hydromorphone': ['dilaudid'],
    'acetaminophen': ['tylenol', 'paracetamol', 'apap'],
    'ibuprofen': ['advil', 'motrin'],
    'ketorolac': ['toradol'],
    'dexmedetomidine': ['precedex'],
    'ketamine': ['ketalar'],
    'chloral-hydrate': ['noctec', 'aquachloral'],

    // Electrolytes
    'potassium-chloride': ['kcl', 'k-dur', 'klor-con'],
    'calcium-gluconate': ['cal-glu'],
    'calcium-chloride': ['cacl', 'cal-chloride'],
    'magnesium-sulfate': ['mgso4', 'mag sulfate'],
    'phosphorus': ['k-phos', 'na-phos', 'neutra-phos'],
    'vitamin-d': ['ergocalciferol', 'cholecalciferol', 'd2', 'd3'],
    'iron-supplement': ['ferrous sulfate', 'fer-in-sol'],
    'zinc-supplement': ['zinc sulfate'],

    // Other Pediatric
    'hydrocortisone': ['solu-cortef', 'cortef'],
    'fludrocortisone': ['florinef'],
    'enoxaparin': ['lovenox'],
    'heparin': ['hep-lock'],
    'regular-insulin': ['humulin r', 'novolin r'],
    'octreotide': ['sandostatin'],
    'desmopressin': ['ddavp', 'stimate'],
    'fluconazole-peds': ['diflucan'],
    'vitamin-k': ['phytonadione', 'mephyton', 'aquamephyton']
};

// Category display names for search results
const categoryDisplayNames = {
    'iv-common': 'IV Antibiotics',
    'aminoglycosides': 'Aminoglycosides',
    'pediatric': 'Pediatric Oral Antibiotics',
    'icu': 'ICU/Critical Care',
    'general': 'General Ward',
    'antiseizure': 'Antiseizure',
    'nephrology': 'Nephrology',
    'cardiac': 'Cardiac',
    'respiratory': 'Respiratory',
    'gi': 'GI Medications',
    'pain-sedation': 'Pain/Sedation',
    'electrolytes': 'Electrolytes',
    'other-pediatric': 'Other Pediatric'
};

// ==========================================
// Medication Search Functions
// ==========================================

function searchMedication(query) {
    const searchResults = document.getElementById('search-results');

    if (!query || query.length < 2) {
        searchResults.classList.add('hidden');
        return;
    }

    query = query.toLowerCase().trim();
    const results = [];

    // Search through all categories
    for (const [categoryKey, drugs] of Object.entries(antibioticDatabase)) {
        for (const [drugKey, drug] of Object.entries(drugs)) {
            const genericName = drug.name.toLowerCase();
            const aliases = medicationAliases[drugKey] || [];

            // Check if query matches generic name
            let matchType = null;
            let matchedTerm = null;

            if (genericName.includes(query)) {
                matchType = 'generic';
                matchedTerm = drug.name;
            } else {
                // Check aliases (brand names)
                for (const alias of aliases) {
                    if (alias.toLowerCase().includes(query)) {
                        matchType = 'brand';
                        matchedTerm = alias;
                        break;
                    }
                }
            }

            if (matchType) {
                results.push({
                    categoryKey,
                    drugKey,
                    drug,
                    matchType,
                    matchedTerm,
                    aliases,
                    score: matchedTerm.toLowerCase().startsWith(query) ? 0 : 1 // Prioritize prefix matches
                });
            }
        }
    }

    // Sort results by match quality
    results.sort((a, b) => {
        if (a.score !== b.score) return a.score - b.score;
        return a.drug.name.localeCompare(b.drug.name);
    });

    // Limit to top 10 results
    const topResults = results.slice(0, 10);

    if (topResults.length === 0) {
        searchResults.innerHTML = '<div class="no-results">No medications found</div>';
        searchResults.classList.remove('hidden');
        return;
    }

    // Build results HTML
    let html = '';
    for (const result of topResults) {
        const brandNames = result.aliases.length > 0
            ? result.aliases.map(a => a.charAt(0).toUpperCase() + a.slice(1)).join(', ')
            : '';

        html += `
            <div class="search-result-item"
                 onclick="selectMedicationFromSearch('${result.categoryKey}', '${result.drugKey}')">
                <div class="med-name">${highlightMatch(result.drug.name, query)}</div>
                ${brandNames ? `<div class="med-brand">Also: ${highlightMatch(brandNames, query)}</div>` : ''}
                <span class="med-category">${categoryDisplayNames[result.categoryKey]}</span>
            </div>
        `;
    }

    searchResults.innerHTML = html;
    searchResults.classList.remove('hidden');
}

function highlightMatch(text, query) {
    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
    return text.replace(regex, '<span class="search-highlight">$1</span>');
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function selectMedicationFromSearch(categoryKey, drugKey) {
    // Set the category dropdown
    const categorySelect = document.getElementById('abx-category');
    categorySelect.value = categoryKey;

    // Update the medication list for that category
    updateAntibioticList();

    // Set the medication dropdown
    const drugSelect = document.getElementById('abx-select');
    drugSelect.value = drugKey;

    // Trigger the info update
    updateAntibioticInfo();

    // Clear the search
    document.getElementById('med-search').value = '';
    document.getElementById('search-results').classList.add('hidden');
}

// Close search results when clicking outside (legacy - for non-dual-column mode)
document.addEventListener('click', function(e) {
    const searchContainer = document.querySelector('.search-container');
    const searchResults = document.getElementById('search-results');

    if (searchContainer && searchResults && !searchContainer.contains(e.target)) {
        searchResults.classList.add('hidden');
    }
});

// ==========================================
// Antibiotic Calculator Functions
// ==========================================

function updateAntibioticList() {
    const category = document.getElementById('abx-category').value;
    const select = document.getElementById('abx-select');
    const drugs = antibioticDatabase[category];

    // Clear existing options
    select.innerHTML = '<option value="">-- Select Medication --</option>';

    // Add drugs from selected category
    for (const [key, drug] of Object.entries(drugs)) {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = drug.name;
        select.appendChild(option);
    }

    // Hide info box when category changes
    document.getElementById('abx-info').classList.add('hidden');
    document.getElementById('abx-result').classList.add('hidden');
}

function updateAntibioticInfo() {
    const category = document.getElementById('abx-category').value;
    const drugKey = document.getElementById('abx-select').value;
    const ageGroup = document.getElementById('abx-age-group').value;
    const infoBox = document.getElementById('abx-info');

    if (!drugKey) {
        infoBox.classList.add('hidden');
        return;
    }

    const drug = antibioticDatabase[category][drugKey];
    const dosing = drug[ageGroup];

    if (!dosing || dosing.dose === null) {
        infoBox.classList.add('hidden');
        document.getElementById('abx-result').classList.add('hidden');
        showError(document.getElementById('abx-result'),
            `${drug.name} dosing not established for ${ageGroup === 'neonate' ? 'neonates' : 'this age group'}`);
        return;
    }

    // Show drug info
    infoBox.classList.remove('hidden');

    if (dosing.fixedDose) {
        document.getElementById('abx-standard-dose').textContent = `${dosing.dose} ${dosing.unit}`;
    } else {
        document.getElementById('abx-standard-dose').textContent = `${dosing.dose} ${dosing.unit}`;
    }
    document.getElementById('abx-frequency').textContent = dosing.frequency;
    document.getElementById('abx-max-dose').textContent = dosing.maxDaily ? `${formatNumber(dosing.maxDaily)} ${dosing.unit === 'g' ? 'g' : 'mg'}/day` : 'Weight-based';

    if (drug.notes) {
        document.getElementById('abx-notes').textContent = drug.notes;
        document.getElementById('abx-notes-row').style.display = 'flex';
    } else {
        document.getElementById('abx-notes-row').style.display = 'none';
    }
}

function calculateAntibioticDose() {
    const category = document.getElementById('abx-category').value;
    const drugKey = document.getElementById('abx-select').value;
    const weight = parseFloat(document.getElementById('abx-patient-weight').value);
    const weightUnit = document.getElementById('abx-weight-unit').value;
    const ageGroup = document.getElementById('abx-age-group').value;
    const renalFunction = document.getElementById('abx-renal').value;
    const indication = document.getElementById('abx-indication').value;

    const resultBox = document.getElementById('abx-result');

    // Validation
    if (!drugKey) {
        showError(resultBox, 'Please select an antibiotic');
        return;
    }

    const drug = antibioticDatabase[category][drugKey];
    const dosing = drug[ageGroup];

    if (!dosing || dosing.dose === null) {
        showError(resultBox, `${drug.name} dosing not established for ${ageGroup === 'neonate' ? 'neonates' : 'this age group'}`);
        return;
    }

    // Convert weight to kg
    let weightInKg = weight;
    if (weightUnit === 'lb') {
        weightInKg = weight * 0.453592;
    }

    // Validate weight for non-fixed dose drugs
    if (!dosing.fixedDose && (isNaN(weightInKg) || weightInKg <= 0)) {
        showError(resultBox, 'Please enter a valid patient weight');
        return;
    }

    // Calculate dose
    let singleDose;
    let doseUnit = dosing.unit;
    let frequency = dosing.frequency;

    if (dosing.fixedDose) {
        singleDose = dosing.dose;
    } else {
        singleDose = weightInKg * dosing.dose;

        // Apply max dose cap
        if (dosing.maxDaily) {
            const freqNum = getFrequencyNumber(frequency);
            const maxSingle = dosing.maxDaily / freqNum;
            if (singleDose > maxSingle) {
                singleDose = maxSingle;
            }
        }
    }

    // Renal adjustments
    let renalAdjustment = null;
    if (drug.renalAdjust && renalFunction !== 'normal' && drug.renalDosing) {
        const renalInfo = drug.renalDosing[renalFunction];
        if (renalInfo) {
            renalAdjustment = renalInfo;
            frequency = renalInfo.adjust;
        }
    }

    // Indication adjustments (simplified)
    if (indication === 'severe' || indication === 'meningitis') {
        // Some drugs need higher doses for severe infections
        if (drugKey === 'ceftriaxone') {
            singleDose = ageGroup === 'adult' ? 2000 : Math.min(weightInKg * 100, 4000);
            frequency = indication === 'meningitis' ? 'Q12H' : 'Q12-24H';
        } else if (drugKey === 'meropenem' || drugKey === 'meropenem-extended') {
            singleDose = ageGroup === 'adult' ? 2000 : Math.min(weightInKg * 40, 2000);
            frequency = 'Q8H';
        } else if (drugKey.includes('vancomycin')) {
            // Higher target for severe infections
        }
    }

    // Format dose display
    let doseDisplay;
    if (doseUnit === 'g') {
        if (singleDose >= 1000) {
            doseDisplay = formatNumber(singleDose / 1000) + ' g';
        } else {
            doseDisplay = formatNumber(singleDose) + ' g';
        }
    } else {
        doseDisplay = formatNumber(singleDose) + ' ' + doseUnit;
    }

    // Calculate daily total
    const freqNum = getFrequencyNumber(frequency);
    let dailyTotal = singleDose * freqNum;
    let dailyDisplay;
    if (doseUnit === 'g') {
        dailyDisplay = formatNumber(dailyTotal / 1000) + ' g/day';
    } else {
        dailyDisplay = formatNumber(dailyTotal) + ' ' + doseUnit + '/day';
    }

    // Display results
    resultBox.classList.remove('hidden', 'error');
    resultBox.innerHTML = `
        <h3>Recommended Dosing</h3>
        <div class="result-item">
            <span class="label">Single Dose:</span>
            <span id="abx-single-dose" class="value">${doseDisplay}</span>
        </div>
        <div class="result-item">
            <span class="label">Frequency:</span>
            <span id="abx-result-freq" class="value">${frequency}</span>
        </div>
        <div class="result-item">
            <span class="label">Daily Total:</span>
            <span id="abx-daily-total" class="value">${dailyDisplay}</span>
        </div>
        ${renalAdjustment ? `
        <div class="result-item" style="background: #fef3c7; padding: 0.5rem; border-radius: 4px; margin-top: 0.5rem;">
            <span class="label" style="color: #92400e;">Renal Adjustment:</span>
            <span class="value" style="color: #92400e;">${renalAdjustment.note}</span>
        </div>
        ` : ''}
        <div class="result-item">
            <span class="label">Route:</span>
            <span id="abx-route" class="value">${drug.route}</span>
        </div>
        ${!dosing.fixedDose ? `
        <div class="result-item">
            <span class="label">Weight Used:</span>
            <span class="value">${formatNumber(weightInKg)} kg</span>
        </div>
        ` : ''}
        ${drug.warnings && drug.warnings.length > 0 ? `
        <div class="warning-box" style="margin-top: 1rem; padding: 0.75rem; background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 0 4px 4px 0;">
            <strong style="color: #dc2626;">Warnings:</strong>
            <ul style="margin: 0.5rem 0 0 1rem; color: #7f1d1d;">
                ${drug.warnings.map(w => `<li>${w}</li>`).join('')}
            </ul>
        </div>
        ` : ''}
    `;
}

function getFrequencyNumber(freq) {
    if (freq.includes('Q4H') || freq.includes('Q4-6H')) return 6;
    if (freq.includes('Q6H')) return 4;
    if (freq.includes('Q8H')) return 3;
    if (freq.includes('Q12H')) return 2;
    if (freq.includes('Q24H') || freq.includes('daily') || freq.includes('QD')) return 1;
    if (freq.includes('Q36H')) return 0.67;
    if (freq.includes('Q48H')) return 0.5;
    // Default to once daily for complex regimens
    return 1;
}

// ==========================================
// Dual Column Layout Functions
// ==========================================

// Switch calculator in a column
function switchCalculator(column, calcType) {
    const columnEl = document.getElementById(`${column}-column`);

    // Hide all sections in this column
    columnEl.querySelectorAll('.calculator-section').forEach(section => {
        section.classList.remove('active');
    });

    // Show selected section
    const targetSection = document.getElementById(`${column}-${calcType}`);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Initialize medication list if switching to antibiotics
    if (calcType === 'antibiotics') {
        updateAntibioticListColumn(column);
    }
}

// Switch drip mode for a column
function switchDripMode(column, mode) {
    const section = document.getElementById(`${column}-drip-rate`);

    // Update buttons
    section.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    // Show/hide modes
    document.getElementById(`${column}-volume-mode`).classList.toggle('active', mode === 'volume');
    document.getElementById(`${column}-dose-mode`).classList.toggle('active', mode === 'dose');

    // Hide result
    document.getElementById(`${column}-drip-rate-result`).classList.add('hidden');
}

// Switch dilution mode for a column
function switchDilutionMode(column, mode) {
    const section = document.getElementById(`${column}-dilution`);

    // Update buttons
    section.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    // Show/hide modes
    document.getElementById(`${column}-target-conc-mode`).classList.toggle('active', mode === 'target-conc');
    document.getElementById(`${column}-reconstitution-mode`).classList.toggle('active', mode === 'reconstitution');

    // Hide result
    document.getElementById(`${column}-dilution-result`).classList.add('hidden');
}

// Toggle dose weight field
function toggleDoseWeight(column) {
    const doseUnit = document.getElementById(`${column}-desired-dose-unit`).value;
    const weightGroup = document.getElementById(`${column}-dose-weight-group`);
    weightGroup.style.display = doseUnit === 'mcg/kg/min' ? 'block' : 'none';
}

// Weight-based dosing for column
function calculateWeightDoseColumn(column) {
    const weight = parseFloat(document.getElementById(`${column}-patient-weight`).value);
    const weightUnit = document.getElementById(`${column}-weight-unit`).value;
    const dosePerKg = parseFloat(document.getElementById(`${column}-dose-per-kg`).value);
    const doseUnit = document.getElementById(`${column}-dose-unit`).value;
    const frequency = parseInt(document.getElementById(`${column}-frequency`).value);

    const resultBox = document.getElementById(`${column}-weight-dose-result`);

    if (isNaN(weight) || weight <= 0) {
        showError(resultBox, 'Please enter a valid patient weight');
        return;
    }
    if (isNaN(dosePerKg) || dosePerKg <= 0) {
        showError(resultBox, 'Please enter a valid dose per kg');
        return;
    }

    let weightInKg = weightUnit === 'lb' ? weight * 0.453592 : weight;
    const singleDose = weightInKg * dosePerKg;
    const dailyDose = singleDose * frequency;

    resultBox.classList.remove('hidden', 'error');
    document.getElementById(`${column}-single-dose`).textContent = formatNumber(singleDose) + ' ' + doseUnit.replace('/kg', '');
    document.getElementById(`${column}-daily-dose`).textContent = formatNumber(dailyDose) + ' ' + doseUnit.replace('/kg', '') + '/day';
    document.getElementById(`${column}-weight-used`).textContent = formatNumber(weightInKg) + ' kg';
}

// Drip rate for column (volume-based)
function calculateDripRateColumn(column) {
    const totalVolume = parseFloat(document.getElementById(`${column}-total-volume`).value);
    const infusionTime = parseFloat(document.getElementById(`${column}-infusion-time`).value);
    const timeUnit = document.getElementById(`${column}-time-unit`).value;
    const dropFactor = parseInt(document.getElementById(`${column}-drop-factor`).value);

    const resultBox = document.getElementById(`${column}-drip-rate-result`);

    if (isNaN(totalVolume) || totalVolume <= 0) {
        showError(resultBox, 'Please enter a valid volume');
        return;
    }
    if (isNaN(infusionTime) || infusionTime <= 0) {
        showError(resultBox, 'Please enter a valid infusion time');
        return;
    }

    let timeInHours = timeUnit === 'min' ? infusionTime / 60 : infusionTime;
    const flowRate = totalVolume / timeInHours;
    const dropRate = (totalVolume * dropFactor) / (timeInHours * 60);

    resultBox.classList.remove('hidden', 'error');
    document.getElementById(`${column}-flow-rate`).textContent = formatNumber(flowRate) + ' mL/hr';
    document.getElementById(`${column}-drop-rate`).textContent = Math.round(dropRate) + ' gtt/min';
    document.getElementById(`${column}-duration`).textContent = formatTime(timeInHours);

    document.getElementById(`${column}-drops-result`).style.display = 'flex';
    document.getElementById(`${column}-duration-result`).style.display = 'flex';
    document.getElementById(`${column}-concentration-result`).style.display = 'none';
}

// Drip rate for column (dose-based)
function calculateDoseBasedRateColumn(column) {
    const drugAmount = parseFloat(document.getElementById(`${column}-drug-amount`).value);
    const drugAmountUnit = document.getElementById(`${column}-drug-amount-unit`).value;
    const bagVolume = parseFloat(document.getElementById(`${column}-bag-volume`).value);
    const desiredDose = parseFloat(document.getElementById(`${column}-desired-dose`).value);
    const desiredDoseUnit = document.getElementById(`${column}-desired-dose-unit`).value;

    const resultBox = document.getElementById(`${column}-drip-rate-result`);

    if (isNaN(drugAmount) || drugAmount <= 0) {
        showError(resultBox, 'Please enter a valid drug amount');
        return;
    }
    if (isNaN(bagVolume) || bagVolume <= 0) {
        showError(resultBox, 'Please enter a valid bag volume');
        return;
    }
    if (isNaN(desiredDose) || desiredDose <= 0) {
        showError(resultBox, 'Please enter a valid desired dose');
        return;
    }

    let drugAmountConverted = drugAmount;
    if (drugAmountUnit === 'mg' && desiredDoseUnit.includes('mcg')) {
        drugAmountConverted = drugAmount * 1000;
    } else if (drugAmountUnit === 'mcg' && desiredDoseUnit.includes('mg')) {
        drugAmountConverted = drugAmount / 1000;
    }

    const concentration = drugAmountConverted / bagVolume;
    let dosePerHour = desiredDose;

    if (desiredDoseUnit === 'mcg/min') {
        dosePerHour = desiredDose * 60;
    } else if (desiredDoseUnit === 'mcg/kg/min') {
        const patientWeight = parseFloat(document.getElementById(`${column}-dose-patient-weight`).value);
        if (isNaN(patientWeight) || patientWeight <= 0) {
            showError(resultBox, 'Please enter patient weight for mcg/kg/min calculations');
            return;
        }
        dosePerHour = desiredDose * patientWeight * 60;
    }

    const flowRate = dosePerHour / concentration;
    const duration = bagVolume / flowRate;

    resultBox.classList.remove('hidden', 'error');
    document.getElementById(`${column}-flow-rate`).textContent = formatNumber(flowRate) + ' mL/hr';

    let concUnit = drugAmountUnit + '/mL';
    if (drugAmountUnit === 'mg' && desiredDoseUnit.includes('mcg')) {
        concUnit = 'mcg/mL';
    }
    document.getElementById(`${column}-concentration`).textContent = formatNumber(concentration) + ' ' + concUnit;
    document.getElementById(`${column}-concentration-result`).style.display = 'flex';
    document.getElementById(`${column}-duration`).textContent = formatTime(duration);
    document.getElementById(`${column}-duration-result`).style.display = 'flex';
    document.getElementById(`${column}-drops-result`).style.display = 'none';
}

// Dilution calculator for column
function calculateDilutionColumn(column) {
    const stockConc = parseFloat(document.getElementById(`${column}-stock-conc`).value);
    const stockConcUnit = document.getElementById(`${column}-stock-conc-unit`).value;
    const targetConc = parseFloat(document.getElementById(`${column}-target-conc`).value);
    const targetConcUnit = document.getElementById(`${column}-target-conc-unit`).value;
    const finalVolume = parseFloat(document.getElementById(`${column}-final-volume`).value);

    const resultBox = document.getElementById(`${column}-dilution-result`);

    if (isNaN(stockConc) || stockConc <= 0) {
        showError(resultBox, 'Please enter a valid stock concentration');
        return;
    }
    if (isNaN(targetConc) || targetConc <= 0) {
        showError(resultBox, 'Please enter a valid target concentration');
        return;
    }
    if (isNaN(finalVolume) || finalVolume <= 0) {
        showError(resultBox, 'Please enter a valid final volume');
        return;
    }

    let stockConverted = stockConc;
    let targetConverted = targetConc;

    if (stockConcUnit === '%') stockConverted = stockConc * 10;
    if (targetConcUnit === '%') targetConverted = targetConc * 10;

    if (stockConcUnit === 'mcg/mL' && targetConcUnit === 'mg/mL') {
        stockConverted = stockConc / 1000;
    } else if (stockConcUnit === 'mg/mL' && targetConcUnit === 'mcg/mL') {
        targetConverted = targetConc / 1000;
    }

    if (targetConverted >= stockConverted) {
        showError(resultBox, 'Target concentration must be less than stock concentration');
        return;
    }

    const stockVolume = (targetConverted * finalVolume) / stockConverted;
    const diluentVolume = finalVolume - stockVolume;

    resultBox.classList.remove('hidden', 'error');
    document.getElementById(`${column}-stock-volume`).textContent = formatNumber(stockVolume) + ' mL';
    document.getElementById(`${column}-diluent-add`).textContent = formatNumber(diluentVolume) + ' mL';
    document.getElementById(`${column}-final-conc`).textContent = formatNumber(targetConc) + ' ' + targetConcUnit;

    document.getElementById(`${column}-stock-vol-result`).style.display = 'flex';
    document.getElementById(`${column}-diluent-vol-result`).style.display = 'flex';
    document.getElementById(`${column}-final-conc-result`).style.display = 'flex';
    document.getElementById(`${column}-volume-draw-result`).style.display = 'none';
}

// Reconstitution for column
function calculateReconstitutionColumn(column) {
    const powderAmount = parseFloat(document.getElementById(`${column}-powder-amount`).value);
    const powderUnit = document.getElementById(`${column}-powder-unit`).value;
    const diluentVolume = parseFloat(document.getElementById(`${column}-diluent-volume`).value);
    const desiredDose = parseFloat(document.getElementById(`${column}-desired-dose-recon`).value);
    const desiredDoseUnit = document.getElementById(`${column}-desired-dose-recon-unit`).value;

    const resultBox = document.getElementById(`${column}-dilution-result`);

    if (isNaN(powderAmount) || powderAmount <= 0) {
        showError(resultBox, 'Please enter a valid powder amount');
        return;
    }
    if (isNaN(diluentVolume) || diluentVolume <= 0) {
        showError(resultBox, 'Please enter a valid diluent volume');
        return;
    }
    if (isNaN(desiredDose) || desiredDose <= 0) {
        showError(resultBox, 'Please enter a valid desired dose');
        return;
    }

    let powderConverted = powderAmount;
    let desiredConverted = desiredDose;

    if (powderUnit === 'g') powderConverted = powderAmount * 1000;
    else if (powderUnit === 'mcg') powderConverted = powderAmount / 1000;

    if (desiredDoseUnit === 'g') desiredConverted = desiredDose * 1000;
    else if (desiredDoseUnit === 'mcg') desiredConverted = desiredDose / 1000;

    const finalConcentration = powderConverted / diluentVolume;
    const volumeToDraw = desiredConverted / finalConcentration;

    if (volumeToDraw > diluentVolume) {
        showError(resultBox, 'Desired dose exceeds available drug. Maximum dose: ' + formatNumber(powderConverted) + ' mg');
        return;
    }

    resultBox.classList.remove('hidden', 'error');

    let concUnit = 'mg/mL';
    if (powderUnit === 'mcg' && desiredDoseUnit === 'mcg') concUnit = 'mcg/mL';
    else if (powderUnit === 'units') concUnit = 'units/mL';

    document.getElementById(`${column}-final-conc`).textContent = formatNumber(finalConcentration) + ' ' + concUnit;
    document.getElementById(`${column}-volume-draw`).textContent = formatNumber(volumeToDraw) + ' mL';

    document.getElementById(`${column}-stock-vol-result`).style.display = 'none';
    document.getElementById(`${column}-diluent-vol-result`).style.display = 'none';
    document.getElementById(`${column}-final-conc-result`).style.display = 'flex';
    document.getElementById(`${column}-volume-draw-result`).style.display = 'flex';
}

// Update antibiotic list for column
function updateAntibioticListColumn(column) {
    const category = document.getElementById(`${column}-abx-category`).value;
    const select = document.getElementById(`${column}-abx-select`);
    const drugs = antibioticDatabase[category];

    select.innerHTML = '<option value="">-- Select Medication --</option>';

    for (const [key, drug] of Object.entries(drugs)) {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = drug.name;
        select.appendChild(option);
    }

    document.getElementById(`${column}-abx-info`).classList.add('hidden');
    document.getElementById(`${column}-abx-result`).classList.add('hidden');
}

// Update antibiotic info for column
function updateAntibioticInfoColumn(column) {
    const category = document.getElementById(`${column}-abx-category`).value;
    const drugKey = document.getElementById(`${column}-abx-select`).value;
    const ageGroup = document.getElementById(`${column}-abx-age-group`).value;
    const infoBox = document.getElementById(`${column}-abx-info`);

    if (!drugKey) {
        infoBox.classList.add('hidden');
        return;
    }

    const drug = antibioticDatabase[category][drugKey];
    const dosing = drug[ageGroup];

    if (!dosing || dosing.dose === null) {
        infoBox.classList.add('hidden');
        document.getElementById(`${column}-abx-result`).classList.add('hidden');
        showError(document.getElementById(`${column}-abx-result`),
            `${drug.name} dosing not established for ${ageGroup === 'neonate' ? 'neonates' : 'this age group'}`);
        return;
    }

    infoBox.classList.remove('hidden');
    document.getElementById(`${column}-abx-standard-dose`).textContent = `${dosing.dose} ${dosing.unit}`;
    document.getElementById(`${column}-abx-frequency`).textContent = dosing.frequency;
    document.getElementById(`${column}-abx-max-dose`).textContent = dosing.maxDaily ? `${formatNumber(dosing.maxDaily)} ${dosing.unit === 'g' ? 'g' : 'mg'}/day` : 'Weight-based';

    if (drug.notes) {
        document.getElementById(`${column}-abx-notes`).textContent = drug.notes;
        document.getElementById(`${column}-abx-notes-row`).style.display = 'flex';
    } else {
        document.getElementById(`${column}-abx-notes-row`).style.display = 'none';
    }

    // Show reference link if available
    const refRow = document.getElementById(`${column}-abx-reference-row`);
    const refSpan = document.getElementById(`${column}-abx-reference`);
    if (drug.reference) {
        refSpan.innerHTML = `<a href="${drug.reference}" target="_blank" rel="noopener noreferrer" style="color: var(--primary-light); text-decoration: underline;">View on PubMed/NCBI</a>`;
        refRow.style.display = 'flex';
    } else {
        refRow.style.display = 'none';
    }
}

// Calculate antibiotic dose for column
function calculateAntibioticDoseColumn(column) {
    const category = document.getElementById(`${column}-abx-category`).value;
    const drugKey = document.getElementById(`${column}-abx-select`).value;
    const weight = parseFloat(document.getElementById(`${column}-abx-patient-weight`).value);
    const weightUnit = document.getElementById(`${column}-abx-weight-unit`).value;
    const ageGroup = document.getElementById(`${column}-abx-age-group`).value;
    const renalFunction = document.getElementById(`${column}-abx-renal`).value;
    const indication = document.getElementById(`${column}-abx-indication`).value;

    const resultBox = document.getElementById(`${column}-abx-result`);

    if (!drugKey) {
        showError(resultBox, 'Please select a medication');
        return;
    }

    const drug = antibioticDatabase[category][drugKey];
    const dosing = drug[ageGroup];

    if (!dosing || dosing.dose === null) {
        showError(resultBox, `${drug.name} dosing not established for ${ageGroup === 'neonate' ? 'neonates' : 'this age group'}`);
        return;
    }

    let weightInKg = weight;
    if (weightUnit === 'lb') weightInKg = weight * 0.453592;

    if (!dosing.fixedDose && (isNaN(weightInKg) || weightInKg <= 0)) {
        showError(resultBox, 'Please enter a valid patient weight');
        return;
    }

    let singleDose;
    let doseUnit = dosing.unit;
    let frequency = dosing.frequency;

    if (dosing.fixedDose) {
        singleDose = dosing.dose;
    } else {
        singleDose = weightInKg * dosing.dose;
        if (dosing.maxDaily) {
            const freqNum = getFrequencyNumber(frequency);
            const maxSingle = dosing.maxDaily / freqNum;
            if (singleDose > maxSingle) singleDose = maxSingle;
        }
    }

    let renalAdjustment = null;
    if (drug.renalAdjust && renalFunction !== 'normal' && drug.renalDosing) {
        const renalInfo = drug.renalDosing[renalFunction];
        if (renalInfo) {
            renalAdjustment = renalInfo;
            frequency = renalInfo.adjust;
        }
    }

    if (indication === 'severe' || indication === 'meningitis') {
        if (drugKey === 'ceftriaxone') {
            singleDose = ageGroup === 'adult' ? 2000 : Math.min(weightInKg * 100, 4000);
            frequency = indication === 'meningitis' ? 'Q12H' : 'Q12-24H';
        } else if (drugKey === 'meropenem' || drugKey === 'meropenem-extended') {
            singleDose = ageGroup === 'adult' ? 2000 : Math.min(weightInKg * 40, 2000);
            frequency = 'Q8H';
        }
    }

    let doseDisplay;
    if (doseUnit === 'g') {
        doseDisplay = singleDose >= 1000 ? formatNumber(singleDose / 1000) + ' g' : formatNumber(singleDose) + ' g';
    } else {
        doseDisplay = formatNumber(singleDose) + ' ' + doseUnit;
    }

    const freqNum = getFrequencyNumber(frequency);
    let dailyTotal = singleDose * freqNum;
    let dailyDisplay = doseUnit === 'g' ? formatNumber(dailyTotal / 1000) + ' g/day' : formatNumber(dailyTotal) + ' ' + doseUnit + '/day';

    resultBox.classList.remove('hidden', 'error');
    resultBox.innerHTML = `
        <h3>Recommended Dosing</h3>
        <div class="result-item">
            <span class="label">Single Dose:</span>
            <span class="value">${doseDisplay}</span>
        </div>
        <div class="result-item">
            <span class="label">Frequency:</span>
            <span class="value">${frequency}</span>
        </div>
        <div class="result-item">
            <span class="label">Daily Total:</span>
            <span class="value">${dailyDisplay}</span>
        </div>
        ${renalAdjustment ? `
        <div class="result-item" style="background: #fef3c7; padding: 0.5rem; border-radius: 4px; margin-top: 0.5rem;">
            <span class="label" style="color: #92400e;">Renal Adjustment:</span>
            <span class="value" style="color: #92400e;">${renalAdjustment.note}</span>
        </div>
        ` : ''}
        <div class="result-item">
            <span class="label">Route:</span>
            <span class="value">${drug.route}</span>
        </div>
        ${!dosing.fixedDose ? `
        <div class="result-item">
            <span class="label">Weight Used:</span>
            <span class="value">${formatNumber(weightInKg)} kg</span>
        </div>
        ` : ''}
        ${drug.warnings && drug.warnings.length > 0 ? `
        <div class="warning-box" style="margin-top: 1rem; padding: 0.75rem; background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 0 4px 4px 0;">
            <strong style="color: #dc2626;">Warnings:</strong>
            <ul style="margin: 0.5rem 0 0 1rem; color: #7f1d1d;">
                ${drug.warnings.map(w => `<li>${w}</li>`).join('')}
            </ul>
        </div>
        ` : ''}
    `;
}

// Search medication for column
function searchMedicationColumn(column, query) {
    const searchResults = document.getElementById(`${column}-search-results`);

    if (!query || query.length < 2) {
        searchResults.classList.add('hidden');
        return;
    }

    query = query.toLowerCase().trim();
    const results = [];

    for (const [categoryKey, drugs] of Object.entries(antibioticDatabase)) {
        for (const [drugKey, drug] of Object.entries(drugs)) {
            const genericName = drug.name.toLowerCase();
            const aliases = medicationAliases[drugKey] || [];

            let matchType = null;
            let matchedTerm = null;

            if (genericName.includes(query)) {
                matchType = 'generic';
                matchedTerm = drug.name;
            } else {
                for (const alias of aliases) {
                    if (alias.toLowerCase().includes(query)) {
                        matchType = 'brand';
                        matchedTerm = alias;
                        break;
                    }
                }
            }

            if (matchType) {
                results.push({
                    categoryKey,
                    drugKey,
                    drug,
                    matchType,
                    matchedTerm,
                    aliases,
                    score: matchedTerm.toLowerCase().startsWith(query) ? 0 : 1
                });
            }
        }
    }

    results.sort((a, b) => {
        if (a.score !== b.score) return a.score - b.score;
        return a.drug.name.localeCompare(b.drug.name);
    });

    const topResults = results.slice(0, 10);

    if (topResults.length === 0) {
        searchResults.innerHTML = '<div class="no-results">No medications found</div>';
        searchResults.classList.remove('hidden');
        return;
    }

    let html = '';
    for (const result of topResults) {
        const brandNames = result.aliases.length > 0
            ? result.aliases.map(a => a.charAt(0).toUpperCase() + a.slice(1)).join(', ')
            : '';

        html += `
            <div class="search-result-item"
                 onclick="selectMedicationFromSearchColumn('${column}', '${result.categoryKey}', '${result.drugKey}')">
                <div class="med-name">${highlightMatch(result.drug.name, query)}</div>
                ${brandNames ? `<div class="med-brand">Also: ${highlightMatch(brandNames, query)}</div>` : ''}
                <span class="med-category">${categoryDisplayNames[result.categoryKey]}</span>
            </div>
        `;
    }

    searchResults.innerHTML = html;
    searchResults.classList.remove('hidden');
}

// Select medication from search for column
function selectMedicationFromSearchColumn(column, categoryKey, drugKey) {
    document.getElementById(`${column}-abx-category`).value = categoryKey;
    updateAntibioticListColumn(column);
    document.getElementById(`${column}-abx-select`).value = drugKey;
    updateAntibioticInfoColumn(column);
    document.getElementById(`${column}-med-search`).value = '';
    document.getElementById(`${column}-search-results`).classList.add('hidden');
}

// ==========================================
// Medication Index Panel Functions
// ==========================================

// Category groupings for hierarchical structure
const categoryGroups = {
    'Antibiotics': ['iv-common', 'aminoglycosides', 'pediatric'],
    'Critical Care': ['icu', 'general'],
    'Specialty Medications': ['antiseizure', 'nephrology', 'cardiac', 'respiratory', 'gi'],
    'Supportive Care': ['pain-sedation', 'electrolytes', 'other-pediatric']
};

// Build the medication index panel with hierarchical tree structure
function buildMedicationIndex() {
    const indexContent = document.getElementById('index-content');
    if (!indexContent) return;

    let html = '';

    // Add summary stats
    let totalDrugs = 0;
    let totalWithRef = 0;
    for (const drugs of Object.values(antibioticDatabase)) {
        for (const drug of Object.values(drugs)) {
            totalDrugs++;
            if (drug.reference) totalWithRef++;
        }
    }

    html += `
        <div class="index-stats">
            <span class="stat-item"><strong>${totalDrugs}</strong> medications</span>
            <span class="stat-item"><strong>${totalWithRef}</strong> with references</span>
        </div>
    `;

    // Build hierarchical tree
    for (const [groupName, categoryKeys] of Object.entries(categoryGroups)) {
        // Count total drugs in group
        let groupDrugCount = 0;
        for (const catKey of categoryKeys) {
            if (antibioticDatabase[catKey]) {
                groupDrugCount += Object.keys(antibioticDatabase[catKey]).length;
            }
        }

        html += `
            <div class="index-group" data-group="${groupName}">
                <button class="index-group-header" onclick="toggleIndexGroup('${groupName}')">
                    <span class="tree-icon">📁</span>
                    <span class="group-name">${groupName}</span>
                    <span class="group-count">${groupDrugCount}</span>
                    <span class="expand-icon">▶</span>
                </button>
                <div class="index-group-content" id="index-group-${groupName.replace(/\s+/g, '-')}">
        `;

        for (const categoryKey of categoryKeys) {
            if (!antibioticDatabase[categoryKey]) continue;

            const drugs = antibioticDatabase[categoryKey];
            const categoryName = categoryDisplayNames[categoryKey] || categoryKey;
            const drugCount = Object.keys(drugs).length;

            html += `
                <div class="index-category" data-category="${categoryKey}">
                    <button class="index-category-header" onclick="toggleIndexCategory('${categoryKey}', event)">
                        <span class="tree-line">├─</span>
                        <span class="tree-icon">📂</span>
                        <span class="category-name">${categoryName}</span>
                        <span class="category-count">${drugCount}</span>
                        <span class="expand-icon">▶</span>
                    </button>
                    <div class="index-drug-list" id="index-list-${categoryKey}">
            `;

            const drugEntries = Object.entries(drugs);
            drugEntries.forEach(([drugKey, drug], index) => {
                const isLast = index === drugEntries.length - 1;
                const treeLine = isLast ? '└─' : '├─';
                const aliases = medicationAliases[drugKey] || [];
                const aliasText = aliases.length > 0 ? aliases.slice(0, 2).join(', ') : '';

                const refLink = drug.reference
                    ? `<a href="${drug.reference}" target="_blank" rel="noopener noreferrer" class="ref-link" onclick="event.stopPropagation();" title="View PubMed reference">📖</a>`
                    : '';

                html += `
                    <div class="index-drug-item" data-drug="${drugKey}" data-name="${drug.name.toLowerCase()}" data-aliases="${aliases.join(',').toLowerCase()}">
                        <button class="drug-select-btn" onclick="selectMedicationFromIndex('${categoryKey}', '${drugKey}')">
                            <span class="tree-line-deep">│  ${treeLine}</span>
                            <span class="tree-icon-drug">💊</span>
                            <span class="drug-info">
                                <span class="drug-name">${drug.name}</span>
                                ${aliasText ? `<span class="drug-aliases">(${aliasText})</span>` : ''}
                            </span>
                        </button>
                        ${refLink}
                    </div>
                `;
            });

            html += `
                    </div>
                </div>
            `;
        }

        html += `
                </div>
            </div>
        `;
    }

    indexContent.innerHTML = html;
}

// Toggle group expansion
function toggleIndexGroup(groupName) {
    const group = document.querySelector(`.index-group[data-group="${groupName}"]`);
    const header = group.querySelector('.index-group-header');
    const content = document.getElementById(`index-group-${groupName.replace(/\s+/g, '-')}`);

    if (header && content) {
        header.classList.toggle('expanded');
        content.classList.toggle('expanded');
    }
}

// Toggle category expansion in index
function toggleIndexCategory(categoryKey, event) {
    if (event) event.stopPropagation();

    const category = document.querySelector(`.index-category[data-category="${categoryKey}"]`);
    const header = category.querySelector('.index-category-header');
    const list = document.getElementById(`index-list-${categoryKey}`);

    if (header && list) {
        header.classList.toggle('expanded');
        list.classList.toggle('expanded');
    }
}

// Toggle the entire index panel
function toggleIndexPanel() {
    const panel = document.getElementById('medication-index');
    if (panel) {
        panel.classList.toggle('collapsed');
    }
}

// Expand all categories
function expandAllIndex() {
    document.querySelectorAll('.index-group-header').forEach(h => h.classList.add('expanded'));
    document.querySelectorAll('.index-group-content').forEach(c => c.classList.add('expanded'));
    document.querySelectorAll('.index-category-header').forEach(h => h.classList.add('expanded'));
    document.querySelectorAll('.index-drug-list').forEach(l => l.classList.add('expanded'));
}

// Collapse all categories
function collapseAllIndex() {
    document.querySelectorAll('.index-group-header').forEach(h => h.classList.remove('expanded'));
    document.querySelectorAll('.index-group-content').forEach(c => c.classList.remove('expanded'));
    document.querySelectorAll('.index-category-header').forEach(h => h.classList.remove('expanded'));
    document.querySelectorAll('.index-drug-list').forEach(l => l.classList.remove('expanded'));
}

// Filter medications in the index with highlight
function filterMedicationIndex(query) {
    query = query.toLowerCase().trim();
    const groups = document.querySelectorAll('.index-group');

    // Clear previous highlights
    document.querySelectorAll('.search-match').forEach(el => {
        el.innerHTML = el.textContent;
        el.classList.remove('search-match');
    });

    if (!query) {
        // Reset to collapsed state when search is cleared
        collapseAllIndex();
        document.querySelectorAll('.index-category').forEach(c => c.style.display = 'block');
        document.querySelectorAll('.index-drug-item').forEach(i => i.style.display = 'flex');
        document.querySelectorAll('.index-group').forEach(g => g.style.display = 'block');

        // Reset counts
        updateIndexCounts();
        return;
    }

    groups.forEach(group => {
        let groupVisible = false;
        const categories = group.querySelectorAll('.index-category');

        categories.forEach(category => {
            const header = category.querySelector('.index-category-header');
            const list = category.querySelector('.index-drug-list');
            const items = category.querySelectorAll('.index-drug-item');
            let visibleCount = 0;

            items.forEach(item => {
                const drugName = item.dataset.name || '';
                const drugKey = item.dataset.drug || '';
                const aliases = (item.dataset.aliases || '').split(',');
                const aliasMatch = aliases.some(alias => alias.includes(query));

                if (drugName.includes(query) || drugKey.includes(query) || aliasMatch) {
                    item.style.display = 'flex';
                    visibleCount++;

                    // Highlight matching text
                    const nameSpan = item.querySelector('.drug-name');
                    if (nameSpan && drugName.includes(query)) {
                        nameSpan.classList.add('search-match');
                        nameSpan.innerHTML = highlightSearchTerm(nameSpan.textContent, query);
                    }
                } else {
                    item.style.display = 'none';
                }
            });

            // Show/hide category based on visible drugs
            if (visibleCount > 0) {
                category.style.display = 'block';
                header.classList.add('expanded');
                list.classList.add('expanded');
                groupVisible = true;

                // Update count badge
                const countBadge = header.querySelector('.category-count');
                if (countBadge) countBadge.textContent = visibleCount;
            } else {
                category.style.display = 'none';
            }
        });

        // Show/hide group
        if (groupVisible) {
            group.style.display = 'block';
            group.querySelector('.index-group-header').classList.add('expanded');
            group.querySelector('.index-group-content').classList.add('expanded');
        } else {
            group.style.display = 'none';
        }
    });
}

// Highlight search term in text
function highlightSearchTerm(text, term) {
    const regex = new RegExp(`(${escapeRegex(term)})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

// Update all index counts (used when resetting)
function updateIndexCounts() {
    for (const [categoryKey, drugs] of Object.entries(antibioticDatabase)) {
        const countBadge = document.querySelector(`.index-category[data-category="${categoryKey}"] .category-count`);
        if (countBadge) {
            countBadge.textContent = Object.keys(drugs).length;
        }
    }
}

// Select medication from index and load into left calculator
function selectMedicationFromIndex(categoryKey, drugKey) {
    // Remove previous selection highlight
    document.querySelectorAll('.index-drug-item.selected').forEach(el => el.classList.remove('selected'));

    // Add selection highlight
    const selectedItem = document.querySelector(`.index-drug-item[data-drug="${drugKey}"]`);
    if (selectedItem) selectedItem.classList.add('selected');

    // Switch to medications calculator in left column
    const selector = document.querySelector('#left-column .column-selector');
    if (selector) {
        selector.value = 'antibiotics';
        switchCalculator('left', 'antibiotics');
    }

    // Select the medication
    document.getElementById('left-abx-category').value = categoryKey;
    updateAntibioticListColumn('left');
    document.getElementById('left-abx-select').value = drugKey;
    updateAntibioticInfoColumn('left');

    // Scroll to calculator on mobile
    if (window.innerWidth <= 900) {
        document.getElementById('left-column').scrollIntoView({ behavior: 'smooth' });
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize both columns
    updateAntibioticListColumn('left');
    updateAntibioticListColumn('right');

    // Build medication index
    buildMedicationIndex();

    // Close search results when clicking outside
    document.addEventListener('click', function(e) {
        ['left', 'right'].forEach(column => {
            const searchContainer = document.querySelector(`#${column}-column .search-container`);
            const searchResults = document.getElementById(`${column}-search-results`);
            if (searchContainer && !searchContainer.contains(e.target)) {
                searchResults.classList.add('hidden');
            }
        });
    });
});
