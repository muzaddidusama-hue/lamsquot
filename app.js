// LAMS POWER Quotation Generator SPA Logic (Aligned with Sample Quotation Format & Spill Fixes)

// Initialize PDF.js
const pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

// Application State with exact defaults from the sample quotation
const state = {
  refCode: 'LAMS/OFF/JUN/242026',
  date: '24/06/2026',
  customer: {
    name: 'Al Mahmud',
    address: 'Mirpur 10, Dhaka.'
  },
  capacity: '400W', // Solar System Capacity for Page 1 & Subject
  overviewCapacity: '', // Capacity header for Page 2 (empty defaults to system capacity)
  salesperson: {
    name: 'Usama Bin Hasan',
    title: 'Team Lead - Brand and Promotion, LAMS POWER',
    mobile: '01521546444',
    email: 'ubh.muzaddid17@gmail.com',
    authEmail: 'ubh.muzaddid17@gmail.com',
    password: 'password123',
    web: 'www.lamspowerbd.com'
  },
  overview: {
    panelModel: '550Watt Mono',
    inverterModel: '400Watt',
    origin: 'China',
    totalPrice: 56000,
    priceInWords: '(Fifty Six Thousand taka only)'
  },
  paymentTerms: [
    '100% Payment Should be made at the time of Work Order on cash.',
    'All the Payment should be Favor of LAMS POWER by A/C Payee Cheque.'
  ],
  p3PaymentTerm: '1. 100% Payment Should be paid in advance with work order by A/C payee Cheque in favor of "LAMS POWER".',
  items: [
    { id: '1', name: 'Solar Panel', brand: 'AE Solar', model: 'AE 550CME-132BDS', capacity: '550Watt', qty: 1, price: 13750 },
    { id: '2', name: 'Solar Inverter', brand: 'Talegent', model: 'SunMate 1000', capacity: '400Watt', qty: 1, price: 17000 },
    { id: '3', name: 'Lithium Battery', brand: 'DJDC', model: '', capacity: '50Ah 12V', qty: 1, price: 18000 },
    { id: '4', name: 'Installation', brand: '', model: '', capacity: '', qty: '', price: 7250 },
    { id: '5', name: 'Cable & Structure', brand: '', model: '', capacity: 'As Needed', qty: '', price: '' },
    { id: '6', name: 'Miscellaneous', brand: '', model: '', capacity: '', qty: '', price: '' }
  ],
  specs: [
    { parameter: 'Solar Panel Brand & Type', detail: 'AE Solar Mono-Crystalline' },
    { parameter: 'Inverter Brand & Model', detail: 'Talegent SunMate 1000' },
    { parameter: 'Lithium Battery Brand', detail: 'DJDC 12V 50Ah' },
    { parameter: 'System Mounting Structure', detail: 'Hot Dip Galvanized Steel' },
    { parameter: 'DC Cable & Connectors', detail: 'Premium Copper XLPE' },
    { parameter: 'AC Cables & Breakers', detail: 'Standard Breaker MCB' }
  ],
  zoom: 75,
  contentScale: 100, // content scale factor percentage
  margins: {
    top: 55,
    bottom: 60,
    side: 20
  }
};

// ==========================================================================
// DATE & REFERENCE GENERATOR HELPERS
// ==========================================================================

function getFormattedDate(dateObj) {
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  return `${day}/${month}/${year}`;
}

function generateRefCodeFromStr(dateStr) {
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parts[0].trim();
    const monthIdx = parseInt(parts[1].trim()) - 1;
    const year = parts[2].trim();
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    
    if (monthIdx >= 0 && monthIdx < 12 && day && year) {
      const monthStr = months[monthIdx];
      return `LAMS/OFF/${monthStr}/${day}${year}`;
    }
  }
  return state.refCode;
}

// ==========================================================================
// NUMBERS TO WORDS CONVERTER
// ==========================================================================

function numberToWords(num) {
  if (num === 0) return 'zero';

  const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 
                'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

  function convertLessThanThousand(n) {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    const unit = n % 10;
    const ten = Math.floor(n / 10);
    return tens[ten] + (unit ? ' ' + ones[unit] : '');
  }

  let words = '';

  let crore = Math.floor(num / 10000000);
  num %= 10000000;

  let lakh = Math.floor(num / 100000);
  num %= 100000;

  let thousand = Math.floor(num / 1000);
  num %= 1000;

  let hundred = Math.floor(num / 100);
  let remaining = num % 100;

  if (crore > 0) {
    words += numberToWords(crore) + ' crore ';
  }
  if (lakh > 0) {
    words += convertLessThanThousand(lakh) + ' lakh ';
  }
  if (thousand > 0) {
    words += convertLessThanThousand(thousand) + ' thousand ';
  }
  if (hundred > 0) {
    words += ones[hundred] + ' hundred ';
  }
  if (remaining > 0) {
    if (words !== '') words += 'and ';
    words += convertLessThanThousand(remaining);
  }

  return words.trim();
}

function capitalizeWords(str) {
  return str.split(' ').map(word => {
    if (!word) return '';
    if (word.includes('-')) {
      return word.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('-');
    }
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
}

function updatePriceInWords() {
  const price = state.overview.totalPrice;
  if (price === 0) {
    state.overview.priceInWords = '(Zero taka only)';
  } else {
    const words = numberToWords(price);
    const capitalized = capitalizeWords(words);
    state.overview.priceInWords = `(${capitalized} taka only)`;
  }
}

// ==========================================================================
// STATE MANAGEMENT & CALCULATIONS
// ==========================================================================

function calculateBOMTotal() {
  let total = 0;
  state.items.forEach(item => {
    const qty = parseInt(item.qty);
    const price = parseInt(item.price);
    if (!isNaN(qty) && !isNaN(price)) {
      total += qty * price;
    } else if (!isNaN(price)) {
      total += price;
    }
  });
  state.overview.totalPrice = total;
  updatePriceInWords();
  
  const priceInput = document.getElementById('input-param-price');
  if (priceInput) {
    priceInput.value = total;
  }
}

function isBatteryAdded() {
  return state.items.some(item => {
    const nameLower = (item.name || '').toLowerCase();
    const isBattery = item.id === '3' || 
                      nameLower.includes('battery') || 
                      nameLower.includes('lifepo4') || 
                      nameLower.includes('lithium');
    if (!isBattery) return false;
    
    const qty = parseInt(item.qty);
    return !isNaN(qty) && qty > 0;
  });
}

// ==========================================================================
// RENDER EDITORS (LEFT COLUMN)
// ==========================================================================

function initEditors() {
  // Tab Switching
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => {
        t.classList.remove('active');
        t.classList.remove('border-amber-500');
        t.classList.remove('text-amber-400');
        t.classList.add('border-transparent');
        t.classList.add('text-slate-400');
      });
      tab.classList.add('active');
      tab.classList.remove('border-transparent');
      tab.classList.add('border-amber-500');
      tab.classList.add('text-amber-400');

      const tabId = tab.getAttribute('data-tab');
      document.querySelectorAll('.tab-content').forEach(pane => {
        pane.classList.add('hidden');
      });
      document.getElementById(tabId).classList.remove('hidden');
    });
  });

  // Sync inputs
  document.getElementById('input-date').value = state.date;
  document.getElementById('input-date').addEventListener('input', (e) => {
    state.date = e.target.value;
    state.refCode = generateRefCodeFromStr(e.target.value);
    document.getElementById('field-ref-code').innerText = state.refCode;
    updatePreview();
  });

  document.getElementById('field-ref-code').innerText = state.refCode;

  document.getElementById('input-cust-name').value = state.customer.name;
  document.getElementById('input-cust-name').addEventListener('input', (e) => {
    state.customer.name = e.target.value;
    updatePreview();
  });

  document.getElementById('input-cust-addr').value = state.customer.address;
  document.getElementById('input-cust-addr').addEventListener('input', (e) => {
    state.customer.address = e.target.value;
    updatePreview();
  });

  document.getElementById('input-capacity').value = state.capacity;
  document.getElementById('input-capacity').addEventListener('input', (e) => {
    state.capacity = e.target.value;
    updatePreview();
  });

  document.getElementById('input-cover-body').value = state.coverGreeting || 
    `Dear Sir,\nIn light of above we are pleased to submit the subject proposal for getting an opportunity to supply product to an exclusive and legendary Company like Yours.\n\nIn this connection we are attaching herewith our proposal in details for your kind perusal.\nWe are Looking forward for your kind order.`;
  
  document.getElementById('input-cover-body').addEventListener('input', (e) => {
    state.coverGreeting = e.target.value;
    updatePreview();
  });

  // Salesperson inputs
  document.getElementById('sales-name').value = state.salesperson.name;
  document.getElementById('sales-name').addEventListener('input', (e) => {
    state.salesperson.name = e.target.value;
    saveSalespersonProfile();
    updatePreview();
  });

  document.getElementById('sales-title').value = state.salesperson.title;
  document.getElementById('sales-title').addEventListener('input', (e) => {
    state.salesperson.title = e.target.value;
    saveSalespersonProfile();
    updatePreview();
  });

  document.getElementById('sales-mobile').value = state.salesperson.mobile;
  document.getElementById('sales-mobile').addEventListener('input', (e) => {
    state.salesperson.mobile = e.target.value;
    saveSalespersonProfile();
    updatePreview();
  });

  document.getElementById('sales-email').value = state.salesperson.email;
  document.getElementById('sales-email').addEventListener('input', (e) => {
    state.salesperson.email = e.target.value;
    saveSalespersonProfile();
    updatePreview();
  });

  document.getElementById('sales-auth-email').value = state.salesperson.authEmail;
  document.getElementById('sales-auth-email').addEventListener('input', (e) => {
    state.salesperson.authEmail = e.target.value;
    saveSalespersonProfile();
    updatePreview();
  });

  document.getElementById('sales-password').value = state.salesperson.password;
  document.getElementById('sales-password').addEventListener('input', (e) => {
    state.salesperson.password = e.target.value;
    saveSalespersonProfile();
    updatePreview();
  });

  // Overview Parameter Box inputs
  document.getElementById('input-overview-capacity').value = state.overviewCapacity || '';
  document.getElementById('input-overview-capacity').addEventListener('input', (e) => {
    state.overviewCapacity = e.target.value;
    updatePreview();
  });

  document.getElementById('input-param-panel').value = state.overview.panelModel;
  document.getElementById('input-param-panel').addEventListener('input', (e) => {
    state.overview.panelModel = e.target.value;
    updatePreview();
  });

  document.getElementById('input-param-inverter').value = state.overview.inverterModel;
  document.getElementById('input-param-inverter').addEventListener('input', (e) => {
    state.overview.inverterModel = e.target.value;
    updatePreview();
  });

  const priceInput = document.getElementById('input-param-price');
  priceInput.value = state.overview.totalPrice;
  priceInput.addEventListener('input', (e) => {
    state.overview.totalPrice = parseInt(e.target.value) || 0;
    updatePriceInWords();
    updatePreview();
  });

  // Margin Calibration Sliders
  document.getElementById('range-margin-top').addEventListener('input', (e) => {
    state.margins.top = e.target.value;
    document.getElementById('val-margin-top').innerText = e.target.value + 'mm';
    document.documentElement.style.setProperty('--margin-top', e.target.value + 'mm');
  });

  document.getElementById('range-margin-bottom').addEventListener('input', (e) => {
    state.margins.bottom = e.target.value;
    document.getElementById('val-margin-bottom').innerText = e.target.value + 'mm';
    document.documentElement.style.setProperty('--margin-bottom', e.target.value + 'mm');
  });

  document.getElementById('range-margin-side').addEventListener('input', (e) => {
    state.margins.side = e.target.value;
    document.getElementById('val-margin-side').innerText = e.target.value + 'mm';
    document.documentElement.style.setProperty('--margin-side', e.target.value + 'mm');
  });

  // Content Font Scale Slider
  document.getElementById('range-content-scale').addEventListener('input', (e) => {
    const val = e.target.value;
    state.contentScale = val;
    document.getElementById('val-content-scale').innerText = val + '%';
    document.documentElement.style.setProperty('--content-scale', val / 100);
  });

  // Margins Tab Zoom Slider (Mirrors header zoom slider)
  document.getElementById('range-preview-zoom').value = state.zoom;
  document.getElementById('val-preview-zoom').innerText = state.zoom + '%';
  document.getElementById('range-preview-zoom').addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    adjustZoom(val);
    document.getElementById('zoom-slider').value = val;
  });

  // Zoom Slider Header
  document.getElementById('zoom-slider').addEventListener('input', (e) => {
    adjustZoom(parseInt(e.target.value));
  });

  document.getElementById('zoom-fit').addEventListener('click', () => {
    adjustZoom(70);
    document.getElementById('zoom-slider').value = 70;
  });

  // Action Buttons
  document.getElementById('btn-print').addEventListener('click', () => {
    window.print();
  });

  document.getElementById('btn-reset').addEventListener('click', () => {
    if (confirm('Reset all values to sample quotation defaults?')) {
      location.reload();
    }
  });

  // File Upload for PDF background
  document.getElementById('pdf-uploader').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      document.getElementById('bg-status').innerHTML = '<span class="text-amber-500 animate-pulse"><i class="fas fa-spinner fa-spin mr-1"></i> Processing Uploaded PDF...</span>';
      const reader = new FileReader();
      reader.onload = function(event) {
        loadPDFBackground(event.target.result);
      };
      reader.readAsArrayBuffer(file);
    }
  });

  // Add Item / Spec / Term click handlers
  document.getElementById('btn-add-item').addEventListener('click', addNewItemRow);
  document.getElementById('btn-add-spec').addEventListener('click', addNewSpecRow);
  document.getElementById('btn-add-term').addEventListener('click', addNewTermRow);

  renderTermsEditor();
  renderItemsEditor();
  renderSpecsEditor();
}

function adjustZoom(val) {
  state.zoom = val;
  document.getElementById('zoom-label').innerText = val + '%';
  document.getElementById('pages-zoom-wrapper').style.transform = `scale(${val / 100})`;
  
  // Mirror to range-preview-zoom slider in Tab 5
  const marginZoomSlider = document.getElementById('range-preview-zoom');
  if (marginZoomSlider) marginZoomSlider.value = val;
  const marginZoomLabel = document.getElementById('val-preview-zoom');
  if (marginZoomLabel) marginZoomLabel.innerText = val + '%';
}

// ==========================================================================
// RENDER DYNAMIC EDITOR LISTS & MATRIX BUILDERS
// ==========================================================================

function renderTermsEditor() {
  const container = document.getElementById('terms-editor-container');
  container.innerHTML = '';
  state.paymentTerms.forEach((term, idx) => {
    const div = document.createElement('div');
    div.className = 'flex items-center gap-2 bg-slate-950 p-2 rounded-lg border border-slate-850';
    div.innerHTML = `
      <span class="text-xs font-bold text-slate-500 w-4">${idx + 1}.</span>
      <input type="text" class="flex-1 bg-transparent text-xs text-slate-200 focus:outline-none" value="${term}">
      <button class="text-slate-500 hover:text-rose-500 transition px-1"><i class="fas fa-trash-can"></i></button>
    `;
    
    // Wire up events
    const input = div.querySelector('input');
    input.addEventListener('input', (e) => {
      state.paymentTerms[idx] = e.target.value;
      updatePreview();
    });
    
    const delBtn = div.querySelector('button');
    delBtn.addEventListener('click', () => {
      state.paymentTerms.splice(idx, 1);
      renderTermsEditor();
      updatePreview();
    });
    
    container.appendChild(div);
  });
}

function addNewTermRow() {
  state.paymentTerms.push('New payment terms description rule.');
  renderTermsEditor();
  updatePreview();
}

function renderItemsEditor() {
  const container = document.getElementById('item-rows-container');
  container.innerHTML = '';
  
  state.items.forEach((item, idx) => {
    const card = document.createElement('div');
    card.className = 'item-card bg-slate-950/65 border border-slate-850 p-4 rounded-xl space-y-3';
    card.innerHTML = `
      <div class="flex justify-between items-center border-b border-slate-850 pb-2">
        <span class="text-xs font-bold text-amber-500 uppercase flex items-center gap-1">
          <i class="fas fa-cube"></i> Item #${idx + 1} - ${item.name || 'Untitled'}
        </span>
        <button class="text-slate-500 hover:text-rose-500 transition text-xs flex items-center gap-1">
          <i class="fas fa-trash-can"></i> Delete
        </button>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Item name</label>
          <input type="text" class="input-item-name w-full bg-slate-900 border border-slate-800 focus:border-amber-500 focus:outline-none rounded px-2.5 py-1.5 text-xs text-slate-200" value="${item.name}">
        </div>
        <div>
          <label class="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Brand</label>
          <input type="text" class="input-item-brand w-full bg-slate-900 border border-slate-800 focus:border-amber-500 focus:outline-none rounded px-2.5 py-1.5 text-xs text-slate-200" value="${item.brand || ''}">
        </div>
        <div>
          <label class="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Model</label>
          <input type="text" class="input-item-model w-full bg-slate-900 border border-slate-800 focus:border-amber-500 focus:outline-none rounded px-2.5 py-1.5 text-xs text-slate-200" value="${item.model || ''}">
        </div>
        <div>
          <label class="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Capacity</label>
          <input type="text" class="input-item-capacity w-full bg-slate-900 border border-slate-800 focus:border-amber-500 focus:outline-none rounded px-2.5 py-1.5 text-xs text-slate-200" value="${item.capacity || ''}">
        </div>
        <div>
          <label class="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Quantity</label>
          <input type="text" class="input-item-qty w-full bg-slate-900 border border-slate-800 focus:border-amber-500 focus:outline-none rounded px-2.5 py-1.5 text-xs text-slate-200" value="${item.qty !== undefined ? item.qty : ''}">
        </div>
        <div>
          <label class="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Price (Tk)</label>
          <input type="text" class="input-item-price w-full bg-slate-900 border border-slate-800 focus:border-amber-500 focus:outline-none rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono" value="${item.price !== undefined ? item.price : ''}">
        </div>
      </div>
    `;

    // Attach Event Listeners
    card.querySelector('.input-item-name').addEventListener('input', (e) => {
      item.name = e.target.value;
      updatePreview();
    });
    card.querySelector('.input-item-brand').addEventListener('input', (e) => {
      item.brand = e.target.value;
      updatePreview();
    });
    card.querySelector('.input-item-model').addEventListener('input', (e) => {
      item.model = e.target.value;
      updatePreview();
    });
    card.querySelector('.input-item-capacity').addEventListener('input', (e) => {
      item.capacity = e.target.value;
      updatePreview();
    });
    card.querySelector('.input-item-qty').addEventListener('input', (e) => {
      const parsed = parseInt(e.target.value);
      item.qty = isNaN(parsed) ? e.target.value : parsed;
      calculateBOMTotal();
      updatePreview();
    });
    card.querySelector('.input-item-price').addEventListener('input', (e) => {
      const parsed = parseInt(e.target.value);
      item.price = isNaN(parsed) ? e.target.value : parsed;
      calculateBOMTotal();
      updatePreview();
    });

    card.querySelector('button').addEventListener('click', () => {
      state.items.splice(idx, 1);
      calculateBOMTotal();
      renderItemsEditor();
      updatePreview();
    });

    container.appendChild(card);
  });
}

function addNewItemRow() {
  const nextId = String(state.items.length + 1);
  state.items.push({ id: nextId, name: 'New Component', brand: '', model: '', capacity: '', qty: 1, price: 10000 });
  calculateBOMTotal();
  renderItemsEditor();
  updatePreview();
}

function renderSpecsEditor() {
  const container = document.getElementById('specs-editor-container');
  container.innerHTML = '';
  state.specs.forEach((spec, idx) => {
    const div = document.createElement('div');
    div.className = 'grid grid-cols-2 gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-850';
    div.innerHTML = `
      <input type="text" class="bg-transparent text-xs text-slate-200 font-semibold border-b border-transparent focus:border-amber-500 focus:outline-none" value="${spec.parameter}">
      <div class="flex items-center justify-between gap-1">
        <input type="text" class="flex-1 bg-transparent text-xs text-slate-300 border-b border-transparent focus:border-amber-500 focus:outline-none" value="${spec.detail}">
        <button class="text-slate-500 hover:text-rose-500 transition px-1"><i class="fas fa-trash-can"></i></button>
      </div>
    `;
    
    // Wire up events
    const paramInput = div.querySelectorAll('input')[0];
    const detailInput = div.querySelectorAll('input')[1];
    
    paramInput.addEventListener('input', (e) => {
      state.specs[idx].parameter = e.target.value;
      updatePreview();
    });
    detailInput.addEventListener('input', (e) => {
      state.specs[idx].detail = e.target.value;
      updatePreview();
    });
    
    const delBtn = div.querySelector('button');
    delBtn.addEventListener('click', () => {
      state.specs.splice(idx, 1);
      renderSpecsEditor();
      updatePreview();
    });
    
    container.appendChild(div);
  });
}

function addNewSpecRow() {
  state.specs.push({ parameter: 'New Parameter', detail: 'Technical specification description details.' });
  renderSpecsEditor();
  updatePreview();
}

// ==========================================================================
// RENDER & SYNC VISUAL PREVIEW (RIGHT COLUMN)
// ==========================================================================

function updatePreview() {
  document.getElementById('preview-ref-code').innerText = state.refCode;
  document.getElementById('preview-date').innerText = state.date;

  document.getElementById('preview-cust-name').innerText = state.customer.name;
  document.getElementById('preview-cust-addr').innerText = state.customer.address;

  const subjectStr = `Sub: Price Proposal for ${state.capacity} Solar System Setup.`;
  document.getElementById('preview-subject').innerText = subjectStr;
  document.getElementById('subject-preview').innerText = subjectStr;

  const rawCoverText = state.coverGreeting || 
    `Dear Sir,\nIn light of above we are pleased to submit the subject proposal for getting an opportunity to supply product to an exclusive and legendary Company like Yours.\n\nIn this connection we are attaching herewith our proposal in details for your kind perusal.\nWe are Looking forward for your kind order.`;
  
  const paragraphs = rawCoverText.split('\n').filter(p => p.trim() !== '');
  const coverContainer = document.getElementById('preview-cover-body');
  coverContainer.innerHTML = '';
  paragraphs.forEach(pText => {
    const p = document.createElement('p');
    p.innerText = pText;
    coverContainer.appendChild(p);
  });

  document.getElementById('preview-sales-name').innerText = state.salesperson.name;
  document.getElementById('preview-sales-title').innerText = state.salesperson.title;
  document.getElementById('preview-sales-mobile').innerText = state.salesperson.mobile;
  document.getElementById('preview-sales-email').innerText = state.salesperson.email;
  document.getElementById('preview-sales-web').innerText = state.salesperson.web;

  const batteryPresent = isBatteryAdded();
  const p2HeaderStr = `${state.overviewCapacity || state.capacity} Complete Off-Grid-Hybrid Solar System Details`;
  document.getElementById('preview-overview-header').innerText = p2HeaderStr;

  document.getElementById('preview-param-panel').innerText = state.overview.panelModel;
  document.getElementById('preview-param-inverter').innerText = state.overview.inverterModel;

  document.getElementById('preview-total-price').innerText = `${state.overview.totalPrice.toLocaleString()}/-`;
  document.getElementById('preview-words-price').innerText = state.overview.priceInWords;
  document.getElementById('words-preview').innerText = state.overview.priceInWords;

  const termsListEl = document.getElementById('preview-terms-list');
  termsListEl.innerHTML = '';
  state.paymentTerms.forEach(term => {
    const li = document.createElement('li');
    li.innerText = term;
    termsListEl.appendChild(li);
  });

  const bomTableEl = document.getElementById('preview-items-table');
  bomTableEl.innerHTML = '';
  state.items.forEach(item => {
    const row = document.createElement('tr');
    
    let qtyDisp = '';
    const qtyInt = parseInt(item.qty);
    if (!isNaN(qtyInt) && qtyInt > 0) {
      qtyDisp = String(qtyInt).padStart(2, '0');
    } else if (item.qty !== undefined) {
      qtyDisp = item.qty;
    }

    let priceDisp = '';
    const priceInt = parseInt(item.price);
    if (!isNaN(priceInt)) {
      priceDisp = priceInt.toLocaleString();
    } else if (item.price !== undefined) {
      priceDisp = item.price;
    }

    row.innerHTML = `
      <td class="py-1 px-2 font-bold">${item.name}</td>
      <td class="py-1 px-2">${item.brand || ''}</td>
      <td class="py-1 px-2">${item.model || ''}</td>
      <td class="py-1 px-2">${item.capacity || ''}</td>
      <td class="py-1 px-2 text-center">${qtyDisp}</td>
      <td class="py-1 px-2 text-right font-bold">${priceDisp}</td>
    `;
    bomTableEl.appendChild(row);
  });

  document.getElementById('preview-p3-payment-term').innerText = state.p3PaymentTerm;

  const panelItem = state.items.find(item => item.name.toLowerCase().includes('panel'));
  const inverterItem = state.items.find(item => item.name.toLowerCase().includes('inverter'));
  
  const panelBrand = panelItem && panelItem.brand && panelItem.brand.trim() ? panelItem.brand : 'AE Solar';
  const inverterBrand = inverterItem && inverterItem.brand && inverterItem.brand.trim() ? inverterItem.brand : 'Talegent';

  const panelBrandCap = panelBrand.toUpperCase();

  const pvAgencyText = `LAMS will install ${panelBrandCap} mono Panel and is the Agent of ${panelBrand} panel for Bangladesh.`;
  const inverterAgencyText = `LAMS is the Agent of ${inverterBrand} inverter for Bangladesh.`;

  document.getElementById('agency-pv-text').innerText = pvAgencyText;
  document.getElementById('agency-inverter-text').innerText = inverterAgencyText;
  document.getElementById('preview-agency-pv').innerText = pvAgencyText;
  document.getElementById('preview-agency-inverter').innerText = inverterAgencyText;

  const p3WarrantyInverter = document.getElementById('p3-warranty-inverter');
  const p3WarrantyBattery = document.getElementById('p3-warranty-battery');
  const p4InverterRow = document.getElementById('page4-inverter-warranty-row');
  const p4BatteryRow = document.getElementById('page4-battery-warranty-row');

  // Solar Inverter warranties are now always shown, decoupled from battery presence
  if (p3WarrantyInverter) p3WarrantyInverter.style.display = '';
  if (p4InverterRow) p4InverterRow.style.display = '';

  // Battery warranties show/hide based on battery presence
  if (batteryPresent) {
    const addedBattery = state.items.find(item => {
      const nameLower = (item.name || '').toLowerCase();
      const isBattery = item.id === '3' || 
                        nameLower.includes('battery') || 
                        nameLower.includes('lifepo4') || 
                        nameLower.includes('lithium');
      if (!isBattery) return false;
      const qty = parseInt(item.qty);
      return !isNaN(qty) && qty > 0;
    });

    if (addedBattery) {
      const nameLower = (addedBattery.name || '').toLowerCase();
      const isLithium = nameLower.includes('lithium') || nameLower.includes('lifepo4');
      
      if (isLithium) {
        if (p3WarrantyBattery) {
          p3WarrantyBattery.innerHTML = `<u><strong>Lithium Battery:</strong></u> 5years warranty provided by manufacturer company.`;
          p3WarrantyBattery.style.display = '';
        }
        if (p4BatteryRow) {
          p4BatteryRow.innerHTML = `
            <td class="py-2 px-3 font-bold">Lithium Battery</td>
            <td class="py-2 px-3">5 Years manufacturer's warranty</td>
          `;
          p4BatteryRow.style.display = '';
        }
      } else {
        if (p3WarrantyBattery) {
          p3WarrantyBattery.innerHTML = `<u><strong>Lead Acid Battery:</strong></u> 2years warranty provided by manufacturer company.`;
          p3WarrantyBattery.style.display = '';
        }
        if (p4BatteryRow) {
          p4BatteryRow.innerHTML = `
            <td class="py-2 px-3 font-bold">Lead Acid Battery</td>
            <td class="py-2 px-3">2 Years replacement warranty</td>
          `;
          p4BatteryRow.style.display = '';
        }
      }
    }
  } else {
    if (p3WarrantyBattery) p3WarrantyBattery.style.display = 'none';
    if (p4BatteryRow) p4BatteryRow.style.display = 'none';
  }
}

// ==========================================================================
// BACKGROUND LOAD & PDF.JS BACKDROP RENDER
// ==========================================================================

async function loadPDFBackground(urlOrBuffer) {
  try {
    let loadingTask;
    if (urlOrBuffer instanceof ArrayBuffer) {
      loadingTask = pdfjsLib.getDocument({ data: urlOrBuffer });
    } else {
      loadingTask = pdfjsLib.getDocument(urlOrBuffer);
    }
    
    const pdfDoc = await loadingTask.promise;
    console.log('PDF loaded, total pages:', pdfDoc.numPages);
    
    const page = await pdfDoc.getPage(1);
    const viewport = page.getViewport({ scale: 2.5 });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;
    
    const bgImageUrl = canvas.toDataURL('image/png');
    
    const pageBgEls = document.querySelectorAll('.a4-page-bg');
    pageBgEls.forEach(el => {
      el.style.backgroundImage = `url(${bgImageUrl})`;
      el.parentElement.classList.remove('fallback-bg');
    });
    
    document.getElementById('bg-status').innerHTML = '<span class="text-emerald-500 font-bold flex items-center gap-1"><i class="fas fa-check-circle"></i> Background Loaded</span>';
  } catch (error) {
    console.error('Failed rendering background PDF:', error);
    document.getElementById('bg-status').innerHTML = '<span class="text-rose-500 font-bold flex items-center gap-1 cursor-pointer" title="PDF loading blocked by local security. Click to upload manually."><i class="fas fa-exclamation-circle"></i> Using CSS Fallback</span>';
    
    const pageEls = document.querySelectorAll('.a4-page');
    pageEls.forEach(el => {
      el.classList.add('fallback-bg');
    });
  }
}

// ==========================================================================
// CLOUD DATABASE LAYER (FIREBASE FIRESTORE & LOCAL FALLBACK ADAPTERS)
// ==========================================================================

let isFirebaseActive = false;
let cloudDb = null;

try {
  if (typeof firebase !== 'undefined' && firebaseConfig && firebaseConfig.apiKey) {
    firebase.initializeApp(firebaseConfig);
    cloudDb = firebase.firestore();
    isFirebaseActive = true;
    console.log('Firebase Cloud Database initialized successfully.');
  } else {
    console.log('Firebase credentials not set. Running in Offline / Local Fallback Mode (saves to localStorage).');
  }
} catch (e) {
  console.error('Failed to initialize Firebase SDK:', e);
}

// User Auth Store helpers
async function db_getUserDb() {
  if (isFirebaseActive && cloudDb) {
    try {
      const snap = await cloudDb.collection('users').get();
      const users = {};
      snap.forEach(doc => {
        users[doc.id] = doc.data();
      });
      // If Firestore database is empty, seed it with the default user
      if (Object.keys(users).length === 0) {
        await db_saveUser(DEFAULT_USERS.usama);
        users.usama = DEFAULT_USERS.usama;
      }
      return users;
    } catch (e) {
      console.error('Error fetching users from Firebase Firestore:', e);
    }
  }
  
  // Local fallback
  if (!localStorage.getItem('lams_user_db')) {
    localStorage.setItem('lams_user_db', JSON.stringify(DEFAULT_USERS));
  }
  return JSON.parse(localStorage.getItem('lams_user_db'));
}

async function db_saveUser(user) {
  if (isFirebaseActive && cloudDb) {
    try {
      await cloudDb.collection('users').doc(user.id).set(user);
      return;
    } catch (e) {
      console.error('Error saving user to Firebase Firestore:', e);
    }
  }
  
  // Local fallback
  const db = JSON.parse(localStorage.getItem('lams_user_db')) || {};
  db[user.id] = user;
  localStorage.setItem('lams_user_db', JSON.stringify(db));
}

// Quotations store helpers
async function db_getSavedQuotations() {
  if (isFirebaseActive && cloudDb) {
    try {
      const snap = await cloudDb.collection('quotations').get();
      const list = [];
      snap.forEach(doc => {
        list.push(doc.data());
      });
      return list;
    } catch (e) {
      console.error('Error fetching quotations from Firebase Firestore:', e);
    }
  }
  
  // Local fallback
  return JSON.parse(localStorage.getItem('lams_saved_quotations')) || [];
}

async function db_saveQuotation(quote) {
  if (isFirebaseActive && cloudDb) {
    try {
      await cloudDb.collection('quotations').doc(quote.id).set(quote);
      return;
    } catch (e) {
      console.error('Error saving quotation to Firebase Firestore:', e);
    }
  }
  
  // Local fallback
  const quotes = JSON.parse(localStorage.getItem('lams_saved_quotations')) || [];
  const index = quotes.findIndex(q => q.id === quote.id);
  if (index !== -1) {
    quotes[index] = quote;
  } else {
    quotes.push(quote);
  }
  localStorage.setItem('lams_saved_quotations', JSON.stringify(quotes));
}

async function db_deleteQuotation(id) {
  if (isFirebaseActive && cloudDb) {
    try {
      await cloudDb.collection('quotations').doc(id).delete();
      return;
    } catch (e) {
      console.error('Error deleting quotation from Firebase Firestore:', e);
    }
  }
  
  // Local fallback
  let quotes = JSON.parse(localStorage.getItem('lams_saved_quotations')) || [];
  quotes = quotes.filter(q => q.id !== id);
  localStorage.setItem('lams_saved_quotations', JSON.stringify(quotes));
}

// ==========================================================================
// AUTHENTICATION & SALES PROFILE STORE
// ==========================================================================

const DEFAULT_USERS = {
  "usama": {
    id: "usama",
    password: "password123",
    authEmail: "ubh.muzaddid17@gmail.com",
    name: "Usama Bin Hasan",
    title: "Team Lead - Brand and Promotion, LAMS POWER",
    mobile: "01521546444",
    email: "ubh.muzaddid17@gmail.com",
    web: "www.lamspowerbd.com"
  }
};

function initAuth() {
  // Initialize Local User Database Fallback Check
  if (!localStorage.getItem('lams_user_db')) {
    localStorage.setItem('lams_user_db', JSON.stringify(DEFAULT_USERS));
  }

  const loginForm = document.getElementById('login-form');
  const errorMsg = document.getElementById('login-error-msg');
  const googleLoginBtn = document.getElementById('btn-google-login');
  
  const userMenuBtn = document.getElementById('user-menu-btn');
  const userDropdown = document.getElementById('user-dropdown-menu');
  const logoutBtn = document.getElementById('btn-logout');

  // Handle Form Login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;

    const userDb = await db_getUserDb();
    
    // Check ID or Authentication Email matches
    let user = userDb[username];
    if (!user) {
      user = Object.values(userDb).find(u => u.authEmail && u.authEmail.trim().toLowerCase() === username);
    }

    if (user && user.password === password) {
      errorMsg.classList.add('hidden');
      localStorage.setItem('lams_active_user', JSON.stringify(user));
      setSalespersonSession(user);
      window.location.hash = '#welcome';
    } else {
      errorMsg.classList.remove('hidden');
    }
  });

  // Handle Google Login
  googleLoginBtn.addEventListener('click', async () => {
    if (isFirebaseActive && typeof firebase !== 'undefined') {
      try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await firebase.auth().signInWithPopup(provider);
        const gUser = result.user;
        
        const userDb = await db_getUserDb();
        let matchedUser = Object.values(userDb).find(u => u.authEmail && u.authEmail.trim().toLowerCase() === gUser.email.toLowerCase());
        
        if (!matchedUser) {
          // Provision new salesperson user profile securely on first Google Login
          matchedUser = {
            id: gUser.uid,
            password: 'google-authenticated',
            authEmail: gUser.email,
            name: gUser.displayName || 'Google Representative',
            title: 'Sales Representative, LAMS POWER',
            mobile: gUser.phoneNumber || '',
            email: gUser.email,
            web: 'www.lamspowerbd.com'
          };
          await db_saveUser(matchedUser);
        }
        
        localStorage.setItem('lams_active_user', JSON.stringify(matchedUser));
        setSalespersonSession(matchedUser);
        window.location.hash = '#welcome';
      } catch (err) {
        console.error('Google Auth Sign In Popup Error:', err);
        alert('Google Sign-in failed. Please ensure popup blocker is disabled and try again.');
      }
    } else {
      // Fallback / Demo Mode: Show the beautiful selection popup
      const googlePopup = document.createElement('div');
      googlePopup.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn';
      googlePopup.innerHTML = `
        <div class="w-[380px] bg-white text-slate-800 rounded-lg shadow-2xl p-6 border border-slate-200 select-none">
          
          <div class="bg-amber-50 border border-amber-200 rounded-lg p-2.5 mb-4 text-[10px] text-amber-800 leading-normal flex items-start gap-1.5 font-sans">
            <i class="fas fa-circle-info text-amber-500 text-xs mt-0.5"></i>
            <div>
              <strong>Demo Mode Active:</strong> Firebase credentials are not set in <code>config.js</code>. Click a profile below to simulate login, or configure credentials to enable real Google OAuth.
            </div>
          </div>

          <div class="flex items-center gap-1 mb-4 justify-center">
            <svg class="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span class="font-bold text-slate-700 text-base">Google Sign In</span>
          </div>
          <p class="text-xs text-slate-500 text-center mb-5">Choose an account to continue to <strong>lamspowerbd.com</strong></p>
          
          <div class="space-y-2.5">
            <button class="mock-google-opt w-full flex items-center gap-3 p-2.5 hover:bg-slate-50 border border-slate-150 rounded-lg text-left transition" data-user="al_mahmud">
              <div class="w-8 h-8 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center">M</div>
              <div>
                <div class="text-xs font-bold text-slate-800">G. M. Al Mahmud</div>
                <div class="text-[10px] text-slate-500">al.mahmud.google@gmail.com</div>
              </div>
            </button>
            
            <button class="mock-google-opt w-full flex items-center gap-3 p-2.5 hover:bg-slate-50 border border-slate-150 rounded-lg text-left transition" data-user="usama_google">
              <div class="w-8 h-8 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center">U</div>
              <div>
                <div class="text-xs font-bold text-slate-800">Usama Bin Hasan</div>
                <div class="text-[10px] text-slate-500">ubh.muzaddid17@gmail.com</div>
              </div>
            </button>
          </div>
          
          <button class="close-google-popup mt-6 w-full text-slate-400 hover:text-slate-600 transition text-[11px] font-bold text-center uppercase tracking-wider">Cancel</button>
        </div>
      `;

      document.body.appendChild(googlePopup);

      googlePopup.querySelectorAll('.mock-google-opt').forEach(opt => {
        opt.addEventListener('click', () => {
          const selectedKey = opt.getAttribute('data-user');
          
          let userProfile = {};
          if (selectedKey === 'al_mahmud') {
            userProfile = {
              id: 'al_mahmud_google',
              password: 'password123',
              authEmail: 'al.mahmud.google@gmail.com',
              name: 'G. M. Al Mahmud',
              title: 'Deputy Manager - Engineering, LAMS POWER',
              mobile: '01712345678',
              email: 'al.mahmud.google@gmail.com',
              web: 'www.lamspowerbd.com'
            };
          } else {
            userProfile = {
              id: 'usama_google',
              password: 'password123',
              authEmail: 'ubh.muzaddid17@gmail.com',
              name: 'Usama Bin Hasan (Google)',
              title: 'Team Lead - Brand and Promotion, LAMS POWER',
              mobile: '01521546444',
              email: 'ubh.muzaddid17@gmail.com',
              web: 'www.lamspowerbd.com'
            };
          }

          localStorage.setItem('lams_active_user', JSON.stringify(userProfile));
          
          db_saveUser(userProfile).then(() => {
            googlePopup.remove();
            setSalespersonSession(userProfile);
            window.location.hash = '#welcome';
          });
        });
      });

      googlePopup.querySelector('.close-google-popup').addEventListener('click', () => {
        googlePopup.remove();
      });
    }
  });

  // User Dropdown toggling
  userMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    userDropdown.classList.toggle('hidden');
  });

  document.addEventListener('click', () => {
    userDropdown.classList.add('hidden');
  });

  // Log Out handler
  logoutBtn.addEventListener('click', () => {
    logout();
  });
}

async function saveSalespersonProfile() {
  const activeUser = JSON.parse(localStorage.getItem('lams_active_user'));
  if (activeUser) {
    activeUser.name = state.salesperson.name;
    activeUser.title = state.salesperson.title;
    activeUser.mobile = state.salesperson.mobile;
    activeUser.email = state.salesperson.email;
    activeUser.authEmail = state.salesperson.authEmail;
    activeUser.password = state.salesperson.password;
    
    localStorage.setItem('lams_active_user', JSON.stringify(activeUser));
    await db_saveUser(activeUser);

    // Update avatar / display name in top bar
    const displayName = document.getElementById('user-display-name');
    const avatar = document.getElementById('user-avatar');
    if (displayName) displayName.innerText = activeUser.name;
    if (avatar) avatar.innerText = activeUser.name ? activeUser.name.charAt(0).toUpperCase() : 'U';
  }
}

function setSalespersonSession(user) {
  // Sync state values
  state.salesperson.name = user.name || '';
  state.salesperson.title = user.title || '';
  state.salesperson.mobile = user.mobile || '';
  state.salesperson.email = user.email || '';
  state.salesperson.authEmail = user.authEmail || '';
  state.salesperson.password = user.password || '';

  // Update input fields in the sidebar
  const nameInput = document.getElementById('sales-name');
  const titleInput = document.getElementById('sales-title');
  const mobileInput = document.getElementById('sales-mobile');
  const emailInput = document.getElementById('sales-email');
  const authEmailInput = document.getElementById('sales-auth-email');
  const passwordInput = document.getElementById('sales-password');

  if (nameInput) nameInput.value = state.salesperson.name;
  if (titleInput) titleInput.value = state.salesperson.title;
  if (mobileInput) mobileInput.value = state.salesperson.mobile;
  if (emailInput) emailInput.value = state.salesperson.email;
  if (authEmailInput) authEmailInput.value = state.salesperson.authEmail;
  if (passwordInput) passwordInput.value = state.salesperson.password;

  // Sync Top Header User Display Name & Avatar
  const displayName = document.getElementById('user-display-name');
  const avatar = document.getElementById('user-avatar');
  
  if (displayName) displayName.innerText = user.name;
  if (avatar) {
    const firstChar = user.name ? user.name.charAt(0).toUpperCase() : 'U';
    avatar.innerText = firstChar;
  }
}

// ==========================================================================
// CLIENT-SIDE ROUTER & VIEW NAVIGATION
// ==========================================================================

let activeQuotationId = null;

async function navigate(hash) {
  const activeUser = JSON.parse(localStorage.getItem('lams_active_user'));
  
  if (!activeUser) {
    hash = '#login';
  } else if (hash === '#login' || hash === '' || hash === '#') {
    hash = '#welcome';
  }

  // Update active state in window location hash
  if (window.location.hash !== hash) {
    window.location.hash = hash;
    return; // Will trigger navigates on next event listener trigger
  }

  // Hide all view routes
  document.querySelectorAll('.view-route').forEach(el => {
    el.classList.add('hidden');
  });

  // Display targeted route
  const targetViewId = hash.substring(1) + '-view';
  const targetView = document.getElementById(targetViewId);
  if (targetView) {
    targetView.classList.remove('hidden');
  }

  // Trigger page-specific loads
  if (hash === '#welcome') {
    await renderDashboard();
  } else if (hash === '#profile') {
    loadProfilePage();
  } else if (hash === '#editor') {
    // If no quotation is loaded, create a fresh one automatically
    if (!activeQuotationId) {
      await createNewQuotation();
    }
  }

  // Sync session salesperson details
  if (activeUser) {
    setSalespersonSession(activeUser);
  }
}

window.logout = function() {
  localStorage.removeItem('lams_active_user');
  activeQuotationId = null;
  navigate('#login');
};

// ==========================================================================
// SAVED QUOTATIONS CRUD CONTROLLER
// ==========================================================================

function getSavedQuotations() {
  // Initial fallback, cloud getters are resolved asynchronously on operations
  return JSON.parse(localStorage.getItem('lams_saved_quotations')) || [];
}

async function createNewQuotation() {
  const activeUser = JSON.parse(localStorage.getItem('lams_active_user'));
  if (!activeUser) return;

  const newId = 'quote_' + Date.now();
  
  // Set default state parameters for a new quote
  const defaultQuote = {
    id: newId,
    userId: activeUser.id,
    lastModified: new Date().toLocaleString(),
    
    refCode: 'LAMS/OFF/' + getMonthCode() + '/' + getFormattedDateCode(),
    date: getFormattedDate(),
    customerName: 'Al Mahmud',
    customerAddress: 'Mirpur 10, Dhaka.',
    capacity: '400W',
    overviewCapacity: '',
    coverGreeting: `Dear Sir,
In light of above we are pleased to submit the subject proposal for getting an opportunity to supply product to an exclusive and legendary Company like Yours.

In this connection we are attaching herewith our proposal in details for your kind perusal.
We are Looking forward for your kind order.`,
    
    items: [
      { id: '1', name: 'Mono Crystalline Solar Panel', brand: '', model: '550Watt Mono', unit: 'Pcs', qty: 4, rate: 9000, total: 36000 },
      { id: '2', name: 'Solar Hybrid Inverter (Pure Sine Wave)', brand: '', model: '400Watt', unit: 'Pcs', qty: 1, rate: 20000, total: 20000 },
      { id: '3', name: 'Lithium Battery (LiFePO4)', brand: '', model: '100Ah 12V', unit: 'Pcs', qty: 0, rate: 35000, total: 0 },
      { id: '4', name: 'Structure for Solar Panel (Floor Mount)', brand: '', model: 'Heavy Duty Lams Std', unit: 'Set', qty: 1, rate: 5000, total: 5000 },
      { id: '5', name: 'DC Cable & Connectors', brand: '', model: '4mm Flex Single Core', unit: 'Coil', qty: 1, rate: 3500, total: 3500 }
    ],
    
    overview: {
      panelModel: '550Watt Mono',
      inverterModel: '400Watt',
      origin: 'China',
      totalPrice: 56000,
      priceInWords: '(Fifty Six Thousand taka only)'
    },
    
    margins: {
      top: 55,
      bottom: 60,
      side: 20,
      scale: 1.0
    }
  };

  activeQuotationId = newId;
  loadQuotationIntoState(defaultQuote);
}

function loadQuotationIntoState(quote) {
  activeQuotationId = quote.id;

  // Sync state parameters
  state.refCode = quote.refCode;
  state.date = quote.date;
  state.customer.name = quote.customerName;
  state.customer.address = quote.customerAddress;
  state.capacity = quote.capacity;
  state.overviewCapacity = quote.overviewCapacity || '';
  state.coverGreeting = quote.coverGreeting;
  state.items = JSON.parse(JSON.stringify(quote.items));
  state.overview = JSON.parse(JSON.stringify(quote.overview));
  state.margins = JSON.parse(JSON.stringify(quote.margins));

  // Sync inputs in the sidebar editor
  document.getElementById('field-ref-code').innerText = state.refCode;
  document.getElementById('input-date').value = state.date;
  document.getElementById('input-cust-name').value = state.customer.name;
  document.getElementById('input-cust-addr').value = state.customer.address;
  document.getElementById('input-capacity').value = state.capacity;
  document.getElementById('input-cover-body').value = state.coverGreeting;

  document.getElementById('input-overview-capacity').value = state.overviewCapacity;
  document.getElementById('input-param-panel').value = state.overview.panelModel;
  document.getElementById('input-param-inverter').value = state.overview.inverterModel;
  document.getElementById('input-param-price').value = state.overview.totalPrice;

  // Sync margins UI
  document.getElementById('range-margin-top').value = state.margins.top;
  document.getElementById('val-margin-top').innerText = state.margins.top + 'mm';
  document.getElementById('range-margin-bottom').value = state.margins.bottom;
  document.getElementById('val-margin-bottom').innerText = state.margins.bottom + 'mm';
  document.getElementById('range-margin-side').value = state.margins.side;
  document.getElementById('val-margin-side').innerText = state.margins.side + 'mm';
  const scalePct = Math.round(state.margins.scale * 100);
  document.getElementById('range-content-scale').value = scalePct;
  document.getElementById('val-content-scale').innerText = scalePct + '%';
  
  document.documentElement.style.setProperty('--margin-top', `${state.margins.top}mm`);
  document.documentElement.style.setProperty('--margin-bottom', `${state.margins.bottom}mm`);
  document.documentElement.style.setProperty('--margin-side', `${state.margins.side}mm`);
  document.documentElement.style.setProperty('--content-scale', state.margins.scale);

  renderItemsEditor();
  renderSpecsEditor();
  calculateBOMTotal();
  updatePreview();
}

async function saveActiveQuotation() {
  if (!activeQuotationId) return;

  const quotes = await db_getSavedQuotations();
  let quote = quotes.find(q => q.id === activeQuotationId);
  if (!quote) {
    const activeUser = JSON.parse(localStorage.getItem('lams_active_user'));
    quote = {
      id: activeQuotationId,
      userId: activeUser ? activeUser.id : 'usama'
    };
  }

  // Collect parameters from state
  quote.lastModified = new Date().toLocaleString();
  quote.refCode = state.refCode;
  quote.date = state.date;
  quote.customerName = state.customer.name;
  quote.customerAddress = state.customer.address;
  quote.capacity = state.capacity;
  quote.overviewCapacity = state.overviewCapacity;
  quote.coverGreeting = state.coverGreeting;
  quote.items = JSON.parse(JSON.stringify(state.items));
  quote.overview = JSON.parse(JSON.stringify(state.overview));
  quote.margins = JSON.parse(JSON.stringify(state.margins));

  await db_saveQuotation(quote);
  alert('Proposal saved successfully!');
}

async function renderDashboard() {
  const activeUser = JSON.parse(localStorage.getItem('lams_active_user'));
  if (!activeUser) return;

  // Set greeting
  const greetingSpan = document.getElementById('welcome-user-name');
  if (greetingSpan) greetingSpan.innerText = activeUser.name;

  const allQuotes = await db_getSavedQuotations();
  const quotes = allQuotes.filter(q => q.userId === activeUser.id);

  // Stats calculation
  const totalCount = quotes.length;
  let totalPipelineVal = 0;
  let lastModifiedStr = 'N/A';

  const tbody = document.getElementById('quotations-list-body');
  tbody.innerHTML = '';

  const selectedQuoteIds = new Set();
  const checkAll = document.getElementById('check-all-quotes');
  if (checkAll) checkAll.checked = false;

  function updateBulkDeleteBtn() {
    const btn = document.getElementById('btn-delete-selected');
    const countSpan = document.getElementById('delete-selected-count');
    if (btn && countSpan) {
      if (selectedQuoteIds.size > 0) {
        btn.classList.remove('hidden');
        countSpan.innerText = selectedQuoteIds.size;
      } else {
        btn.classList.add('hidden');
      }
    }
  }
  
  // Reset bulk delete button on load
  updateBulkDeleteBtn();

  if (quotes.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="py-12 text-center text-slate-500 font-semibold italic">No quotations found. Click "Create New Quotation" to start.</td>
      </tr>
    `;
  } else {
    // Sort recent first
    quotes.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
    lastModifiedStr = quotes[0].lastModified;

    quotes.forEach(quote => {
      totalPipelineVal += quote.overview.totalPrice || 0;
      
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-900/40 transition border-b border-slate-850 text-slate-350';
      tr.innerHTML = `
        <td class="py-4 px-6 w-12"><input type="checkbox" class="quote-row-checkbox rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-0 focus:ring-offset-0 cursor-pointer" data-id="${quote.id}"></td>
        <td class="py-4 px-6 font-bold text-amber-500">${quote.refCode || 'N/A'}</td>
        <td class="py-4 px-6 font-semibold text-white">${quote.customerName || 'N/A'}</td>
        <td class="py-4 px-6">${quote.capacity || 'N/A'} Setup</td>
        <td class="py-4 px-6 font-extrabold text-white">${(quote.overview.totalPrice || 0).toLocaleString()}/- BDT</td>
        <td class="py-4 px-6 text-slate-400">${quote.lastModified}</td>
        <td class="py-4 px-6 text-right space-x-1.5 shrink-0">
          <button class="btn-load-quote bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 hover:border-indigo-500/30 px-3 py-1.5 rounded-lg font-bold transition duration-150 active:scale-95" data-id="${quote.id}">
            <i class="fas fa-edit mr-1"></i> Edit
          </button>
          <button class="btn-delete-quote bg-rose-500/10 hover:bg-rose-500/20 text-rose-450 border border-rose-500/20 hover:border-rose-500/30 px-3 py-1.5 rounded-lg font-bold transition duration-150 active:scale-95" data-id="${quote.id}">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Wire up events
    tbody.querySelectorAll('.btn-load-quote').forEach(btn => {
      btn.addEventListener('click', async () => {
        const qId = btn.getAttribute('data-id');
        const quotesList = await db_getSavedQuotations();
        const targetQuote = quotesList.find(q => q.id === qId);
        if (targetQuote) {
          loadQuotationIntoState(targetQuote);
          window.location.hash = '#editor';
        }
      });
    });

    tbody.querySelectorAll('.btn-delete-quote').forEach(btn => {
      btn.addEventListener('click', async () => {
        const qId = btn.getAttribute('data-id');
        if (confirm('Are you sure you want to delete this quotation proposal?')) {
          await db_deleteQuotation(qId);
          await renderDashboard();
        }
      });
    });

    // Wire up checkbox events
    const rowCheckboxes = tbody.querySelectorAll('.quote-row-checkbox');
    rowCheckboxes.forEach(cb => {
      cb.addEventListener('change', () => {
        const qId = cb.getAttribute('data-id');
        if (cb.checked) {
          selectedQuoteIds.add(qId);
        } else {
          selectedQuoteIds.delete(qId);
        }
        
        // Update check-all checkbox state
        if (checkAll) {
          checkAll.checked = (selectedQuoteIds.size === rowCheckboxes.length);
        }
        updateBulkDeleteBtn();
      });
    });

    if (checkAll) {
      const newCheckAll = checkAll.cloneNode(true);
      checkAll.parentNode.replaceChild(newCheckAll, checkAll);
      
      newCheckAll.addEventListener('change', () => {
        selectedQuoteIds.clear();
        rowCheckboxes.forEach(cb => {
          cb.checked = newCheckAll.checked;
          const qId = cb.getAttribute('data-id');
          if (newCheckAll.checked) {
            selectedQuoteIds.add(qId);
          }
        });
        updateBulkDeleteBtn();
      });
    }

    // Wire up Bulk Delete Action Button
    const bulkDeleteBtn = document.getElementById('btn-delete-selected');
    if (bulkDeleteBtn) {
      const newBulkDeleteBtn = bulkDeleteBtn.cloneNode(true);
      bulkDeleteBtn.parentNode.replaceChild(newBulkDeleteBtn, bulkDeleteBtn);

      newBulkDeleteBtn.addEventListener('click', async () => {
        if (selectedQuoteIds.size === 0) return;
        if (confirm(`Are you sure you want to delete the ${selectedQuoteIds.size} selected quotation proposals?`)) {
          for (const qId of selectedQuoteIds) {
            await db_deleteQuotation(qId);
          }
          selectedQuoteIds.clear();
          await renderDashboard();
        }
      });
    }
  }

  // Update Stats UI
  document.getElementById('stat-total-quotes').innerText = totalCount;
  document.getElementById('stat-total-val').innerText = 'BDT ' + totalPipelineVal.toLocaleString();
  document.getElementById('stat-last-edit').innerText = lastModifiedStr;
  document.getElementById('quote-count-badge').innerText = `${totalCount} saved`;
}

// Date code helpers
function getMonthCode() {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return months[new Date().getMonth()];
}
function getFormattedDateCode() {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}${year}`;
}
function getFormattedDate() {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

// ==========================================================================
// PROFILE DEDICATED PAGE CONTROLLER
// ==========================================================================

function loadProfilePage() {
  const user = JSON.parse(localStorage.getItem('lams_active_user'));
  if (!user) return;

  document.getElementById('profile-page-avatar').innerText = user.name ? user.name.charAt(0).toUpperCase() : 'U';
  document.getElementById('profile-page-display-name').innerText = user.name || 'Sales Representative';

  document.getElementById('profile-page-name').value = user.name || '';
  document.getElementById('profile-page-title').value = user.title || '';
  document.getElementById('profile-page-mobile').value = user.mobile || '';
  document.getElementById('profile-page-email').value = user.email || '';
  document.getElementById('profile-page-web').value = user.web || '';
  document.getElementById('profile-page-auth-email').value = user.authEmail || '';
  document.getElementById('profile-page-password').value = user.password || '';

  renderSalesTeamList();
}

async function renderSalesTeamList() {
  const container = document.getElementById('profile-users-list');
  if (!container) return;

  container.innerHTML = '';
  
  const activeUser = JSON.parse(localStorage.getItem('lams_active_user'));
  const userDb = await db_getUserDb();

  Object.values(userDb).forEach(u => {
    const isSelf = activeUser && u.id === activeUser.id;
    const div = document.createElement('div');
    div.className = 'flex items-center justify-between p-3 bg-slate-950 border border-slate-850 rounded-xl';
    div.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-full bg-slate-800 text-slate-350 font-bold flex items-center justify-center text-xs">
          ${u.name ? u.name.charAt(0).toUpperCase() : 'U'}
        </div>
        <div class="text-left">
          <div class="text-xs font-bold text-white flex items-center gap-1.5">
            ${u.name} ${isSelf ? '<span class="text-[9px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20 uppercase font-black tracking-wider">You</span>' : ''}
          </div>
          <div class="text-[10px] text-slate-500 font-semibold">${u.title || 'Sales Representative'} • ${u.authEmail}</div>
        </div>
      </div>
      ${!isSelf ? `
        <button class="btn-delete-user text-slate-500 hover:text-rose-500 transition px-2.5 py-1.5 hover:bg-rose-500/5 rounded-lg border border-transparent hover:border-rose-500/10 text-xs" data-id="${u.id}">
          <i class="fas fa-trash-can"></i>
        </button>
      ` : ''}
    `;
    
    const delBtn = div.querySelector('.btn-delete-user');
    if (delBtn) {
      delBtn.addEventListener('click', async () => {
        if (confirm(`Are you sure you want to delete the salesperson account for "${u.name}"?`)) {
          const currentDb = await db_getUserDb();
          delete currentDb[u.id];
          
          if (isFirebaseActive && cloudDb) {
            try {
              await cloudDb.collection('users').doc(u.id).delete();
            } catch (e) {
              console.error('Error deleting user from Firebase:', e);
            }
          }
          localStorage.setItem('lams_user_db', JSON.stringify(currentDb));
          
          alert('Salesperson account deleted successfully.');
          await renderSalesTeamList();
        }
      });
    }
    
    container.appendChild(div);
  });
}

async function saveProfilePageDetails(e) {
  e.preventDefault();
  const user = JSON.parse(localStorage.getItem('lams_active_user'));
  if (!user) return;

  user.name = document.getElementById('profile-page-name').value.trim();
  user.title = document.getElementById('profile-page-title').value.trim();
  user.mobile = document.getElementById('profile-page-mobile').value.trim();
  user.email = document.getElementById('profile-page-email').value.trim();
  user.web = document.getElementById('profile-page-web').value.trim();
  user.authEmail = document.getElementById('profile-page-auth-email').value.trim();
  user.password = document.getElementById('profile-page-password').value;

  // Save back to local store
  localStorage.setItem('lams_active_user', JSON.stringify(user));
  await db_saveUser(user);

  // Sync active salesperson session & update signature
  setSalespersonSession(user);
  updatePreview();

  // Show Success Banner
  const successBanner = document.getElementById('profile-save-success-msg');
  successBanner.classList.remove('hidden');
  
  // Update header text in profile page
  document.getElementById('profile-page-avatar').innerText = user.name.charAt(0).toUpperCase();
  document.getElementById('profile-page-display-name').innerText = user.name;

  setTimeout(() => {
    successBanner.classList.add('hidden');
    window.location.hash = '#welcome';
  }, 1200);
}

// ==========================================================================
// INITIALIZATION
// ==========================================================================

window.addEventListener('DOMContentLoaded', async () => {
  state.coverGreeting = `Dear Sir,
In light of above we are pleased to submit the subject proposal for getting an opportunity to supply product to an exclusive and legendary Company like Yours.

In this connection we are attaching herewith our proposal in details for your kind perusal.
We are Looking forward for your kind order.`;

  // Start routers and authentication
  initAuth();
  calculateBOMTotal();
  initEditors();
  updatePreview();
  loadPDFBackground('./LAMS_Pad_Blank.pdf');

  // Listen to hash routes
  window.addEventListener('hashchange', () => navigate(window.location.hash));

  // Setup view actions
  document.getElementById('btn-create-quote').addEventListener('click', async () => {
    await createNewQuotation();
    window.location.hash = '#editor';
  });

  document.getElementById('btn-welcome-logout').addEventListener('click', () => {
    logout();
  });

  document.getElementById('btn-save-quote').addEventListener('click', async () => {
    await saveActiveQuotation();
  });

  document.getElementById('profile-page-form').addEventListener('submit', async (e) => {
    await saveProfilePageDetails(e);
  });

  const addUserForm = document.getElementById('add-user-form');
  if (addUserForm) {
    addUserForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const newUsername = document.getElementById('new-user-username').value.trim().toLowerCase();
      const newPassword = document.getElementById('new-user-password').value;
      const newName = document.getElementById('new-user-name').value.trim();
      const newTitle = document.getElementById('new-user-title').value.trim();
      const newAuthEmail = document.getElementById('new-user-authemail').value.trim();
      const newMobile = document.getElementById('new-user-mobile').value.trim();

      const userDb = await db_getUserDb();

      if (userDb[newUsername]) {
        alert('This Username ID is already taken. Please choose another.');
        return;
      }

      const emailExists = Object.values(userDb).some(u => u.authEmail && u.authEmail.toLowerCase() === newAuthEmail.toLowerCase());
      if (emailExists) {
        alert('This Authentication Email is already registered.');
        return;
      }

      const newUser = {
        id: newUsername,
        password: newPassword,
        authEmail: newAuthEmail,
        name: newName,
        title: newTitle,
        mobile: newMobile,
        email: newAuthEmail,
        web: "www.lamspowerbd.com"
      };

      userDb[newUsername] = newUser;
      localStorage.setItem('lams_user_db', JSON.stringify(userDb));
      await db_saveUser(newUser);

      alert(`Account for "${newName}" has been created successfully!`);
      addUserForm.reset();
      await renderSalesTeamList();
    });
  }

  // Navigate initial view
  await navigate(window.location.hash || '#welcome');
});
