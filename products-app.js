/* ═══════════════════════════════════════════════════════════════
   GMT Mining — Product Page Application Logic
   Features: Category Filter, Search, Pagination (Load More),
             Product Comparison, Quote Request, Detail Modal
   ═══════════════════════════════════════════════════════════════ */

const App = {
    state: {
        activeCategory: 'all',
        searchQuery: '',
        compareList: [],
        quoteList: [],
        currentPage: 1,
        perPage: 12,           // show 12 at a time
        filteredProducts: []
    },

    categories: [
        { key: 'all', label: 'All Products', icon: '◆' },
        { key: 'expansive-mortar', label: 'Expansive Mortar', icon: '⬡' },
        { key: 'drill-bits', label: 'Drill Bits', icon: '⚙' },
        { key: 'diamond-wire', label: 'Diamond Wire', icon: '◇' },
        { key: 'cutting-blades', label: 'Cutting Blades', icon: '⬢' },
        { key: 'drilling-rods', label: 'Drilling Rods', icon: '▮' },
        { key: 'chemical-solutions', label: 'Chemical Solutions', icon: '◎' }
    ],

    init() {
        this.renderCategoryTabs();
        this.filterAndRender();
        this.bindSearch();
    },

    /* ── CATEGORY TABS ── */
    renderCategoryTabs() {
        const container = document.getElementById('categoryTabs');
        if (!container) return;
        container.innerHTML = this.categories.map(cat => {
            const count = cat.key === 'all' ? PRODUCTS.length : PRODUCTS.filter(p => p.category === cat.key).length;
            return `<button class="cat-tab ${cat.key === this.state.activeCategory ? 'active' : ''}" 
                        onclick="App.setCategory('${cat.key}')">
                        ${cat.label}
                        <span class="cat-count">${count}</span>
                    </button>`;
        }).join('');
    },

    setCategory(key) {
        this.state.activeCategory = key;
        this.state.currentPage = 1;
        this.renderCategoryTabs();
        this.filterAndRender();
        // Scroll to top of grid on mobile
        const section = document.getElementById('filtersSection');
        if (section && window.innerWidth < 768) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    },

    /* ── SEARCH ── */
    bindSearch() {
        const input = document.getElementById('searchInput');
        if (!input) return;
        input.addEventListener('input', (e) => {
            this.state.searchQuery = e.target.value.toLowerCase().trim();
            this.state.currentPage = 1;
            this.filterAndRender();
        });
    },

    /* ── FILTER & RENDER ── */
    filterAndRender() {
        let products = [...PRODUCTS];

        // Category filter
        if (this.state.activeCategory !== 'all') {
            products = products.filter(p => p.category === this.state.activeCategory);
        }

        // Search filter
        if (this.state.searchQuery) {
            const q = this.state.searchQuery;
            products = products.filter(p =>
                p.name.toLowerCase().includes(q) ||
                p.tagline.toLowerCase().includes(q) ||
                p.category.toLowerCase().includes(q) ||
                (p.specs.application && p.specs.application.toLowerCase().includes(q)) ||
                (p.specs.grade && p.specs.grade.toLowerCase().includes(q))
            );
        }

        this.state.filteredProducts = products;
        const total = products.length;
        const visible = Math.min(this.state.currentPage * this.state.perPage, total);
        const visibleProducts = products.slice(0, visible);

        // Update count
        const countEl = document.getElementById('productCount');
        if (countEl) countEl.textContent = `${total} Product${total !== 1 ? 's' : ''}`;

        // Render grid
        this.renderGrid(visibleProducts);

        // Load more button
        this.updateLoadMore(visible, total);
    },

    renderGrid(products) {
        const grid = document.getElementById('productGrid');
        if (!grid) return;

        if (products.length === 0) {
            grid.innerHTML = `
                <div class="no-results">
                    <div class="no-results-icon">🔍</div>
                    <h3>No products found</h3>
                    <p style="color:#ccc; font-size: 0.85rem;">Try a different search term or category.</p>
                </div>`;
            return;
        }

        grid.innerHTML = products.map(p => {
            const isCompare = this.state.compareList.some(c => c.id === p.id);
            const specsHtml = p.specs ? Object.entries(p.specs).slice(0, 4).map(([k, v]) =>
                `<div><span class="spec-label">${k}</span><span class="spec-value">${v}</span></div>`
            ).join('') : '';

            return `
            <div class="product-card" id="card-${p.id}">
                <div class="product-card-img" onclick="App.openDetail(${p.id})">
                    <img src="${p.image}" alt="${p.name}" loading="lazy">
                    <span class="product-badge">${p.category.replace('-', ' ')}</span>
                </div>
                <div class="product-card-body">
                    <span class="product-category-label">${p.category.replace('-', ' ')}</span>
                    <div class="product-card-title" onclick="App.openDetail(${p.id})">${p.name}</div>
                    <div class="product-card-tagline">${p.tagline}</div>
                    <div class="product-card-specs">${specsHtml}</div>
                    <div class="product-card-actions">
                        <button class="btn-compare ${isCompare ? 'active' : ''}" onclick="App.toggleCompare(${p.id})">
                            ${isCompare ? '✓' : '⇆'} Compare
                        </button>
                        <button class="btn-quote" onclick="App.addToQuote(${p.id})">
                            Quote
                        </button>
                    </div>
                </div>
            </div>`;
        }).join('');
    },

    /* ── LOAD MORE ── */
    updateLoadMore(visible, total) {
        const wrapper = document.getElementById('loadMoreWrapper');
        const btn = document.getElementById('loadMoreBtn');
        const countEl = document.getElementById('loadMoreCount');
        if (!wrapper) return;

        if (visible >= total) {
            wrapper.style.display = 'none';
        } else {
            wrapper.style.display = 'block';
            if (btn) btn.textContent = `Load More Products`;
            if (countEl) countEl.textContent = `Showing ${visible} of ${total}`;
        }
    },

    loadMore() {
        this.state.currentPage++;
        this.filterAndRender();
    },

    /* ── COMPARE ── */
    toggleCompare(id) {
        const idx = this.state.compareList.findIndex(c => c.id === id);
        if (idx > -1) {
            this.state.compareList.splice(idx, 1);
        } else {
            if (this.state.compareList.length >= 4) {
                this.toast('Maximum 4 products to compare');
                return;
            }
            const product = PRODUCTS.find(p => p.id === id);
            if (product) this.state.compareList.push(product);
        }
        this.filterAndRender();
        this.updateCompareBar();
    },

    updateCompareBar() {
        const bar = document.getElementById('compareBar');
        const preview = document.getElementById('comparePreview');
        const count = document.getElementById('compareCount');
        if (!bar) return;

        if (this.state.compareList.length > 0) {
            bar.classList.add('visible');
            if (count) count.textContent = this.state.compareList.length;
            if (preview) {
                preview.innerHTML = this.state.compareList.map(p =>
                    `<div style="width:36px;height:36px;border:1px solid #eee;padding:3px;flex-shrink:0;">
                        <img src="${p.image}" alt="" style="width:100%;height:100%;object-fit:contain;">
                    </div>`
                ).join('');
            }
        } else {
            bar.classList.remove('visible');
        }
    },

    openCompare() {
        if (this.state.compareList.length < 2) {
            this.toast('Select at least 2 products to compare');
            return;
        }
        const modal = document.getElementById('compareModal');
        if (!modal) return;

        const specKeys = ['grade', 'expansion', 'temperature', 'application', 'size', 'material', 'diameter'];
        const items = this.state.compareList;

        const headerRow = `<tr><th></th>${items.map(p =>
            `<th class="compare-header-item">
                <img class="compare-img" src="${p.image}" alt="${p.name}">
                <strong>${p.name}</strong>
                <span class="compare-badge">${p.category.replace('-', ' ')}</span>
            </th>`
        ).join('')}</tr>`;

        const specRows = specKeys.map(key => {
            const hasAny = items.some(p => p.specs && p.specs[key]);
            if (!hasAny) return '';
            return `<tr><td>${key}</td>${items.map(p =>
                `<td>${(p.specs && p.specs[key]) || '—'}</td>`
            ).join('')}</tr>`;
        }).filter(Boolean).join('');

        const actionRow = `<tr><td></td>${items.map(p =>
            `<td><button class="btn-cta-sm" onclick="App.addToQuote(${p.id})">Request Quote</button></td>`
        ).join('')}</tr>`;

        modal.innerHTML = `
            <div class="modal-backdrop" onclick="App.closeModal('compareModal')"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Product Comparison</h2>
                    <button class="modal-close" onclick="App.closeModal('compareModal')">×</button>
                </div>
                <div class="compare-table-wrapper">
                    <table class="compare-table">
                        <thead>${headerRow}</thead>
                        <tbody>${specRows}${actionRow}</tbody>
                    </table>
                </div>
            </div>`;
        modal.classList.add('visible');
    },

    /* ── QUOTE ── */
    addToQuote(id) {
        if (this.state.quoteList.some(q => q.id === id)) {
            this.toast('Already in your quote list');
            return;
        }
        const product = PRODUCTS.find(p => p.id === id);
        if (product) {
            this.state.quoteList.push({ ...product, qty: 1 });
            this.updateQuoteBadge();
            this.toast(`${product.name} added to quote`);
        }
    },

    updateQuoteBadge() {
        const badge = document.getElementById('quoteBadge');
        if (!badge) return;
        if (this.state.quoteList.length > 0) {
            badge.style.display = 'flex';
            badge.textContent = this.state.quoteList.length;
        } else {
            badge.style.display = 'none';
        }
    },

    openQuote() {
        const modal = document.getElementById('quoteModal');
        if (!modal) return;

        const items = this.state.quoteList;
        const productsHtml = items.length === 0
            ? '<p class="quote-empty">No products added yet. Click "Quote" on any product to add it.</p>'
            : items.map((p, i) => `
                <div class="quote-product-row">
                    <img src="${p.image}" alt="${p.name}">
                    <div class="quote-product-info">
                        <strong>${p.name}</strong>
                        <span>${p.category.replace('-', ' ')}</span>
                    </div>
                    <div class="quote-product-qty">
                        <label>Qty</label>
                        <input type="number" class="qty-input" value="${p.qty}" min="1" onchange="App.updateQty(${i}, this.value)">
                    </div>
                    <button class="quote-remove" onclick="App.removeFromQuote(${i})">×</button>
                </div>
            `).join('');

        modal.innerHTML = `
            <div class="modal-backdrop" onclick="App.closeModal('quoteModal')"></div>
            <div class="modal-content quote-modal-content">
                <div class="modal-header">
                    <h2>Request Quote</h2>
                    <button class="modal-close" onclick="App.closeModal('quoteModal')">×</button>
                </div>
                <div class="quote-body">
                    <h3>Selected Products</h3>
                    ${productsHtml}
                    <div class="quote-form">
                        <h3>Your Details</h3>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Full Name *</label>
                                <input type="text" id="qName" placeholder="Your name">
                            </div>
                            <div class="form-group">
                                <label>Company</label>
                                <input type="text" id="qCompany" placeholder="Company name">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Email *</label>
                                <input type="email" id="qEmail" placeholder="your@email.com">
                            </div>
                            <div class="form-group">
                                <label>Phone</label>
                                <input type="tel" id="qPhone" placeholder="+91 98450 12345">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Project Details</label>
                            <textarea id="qDetails" rows="3" placeholder="Describe your requirements..."></textarea>
                        </div>
                        <button class="btn-submit-quote" onclick="App.submitQuote()">
                            Submit Quote Request
                        </button>
                    </div>
                </div>
            </div>`;
        modal.classList.add('visible');
    },

    updateQty(index, val) {
        if (this.state.quoteList[index]) {
            this.state.quoteList[index].qty = Math.max(1, parseInt(val) || 1);
        }
    },

    removeFromQuote(index) {
        this.state.quoteList.splice(index, 1);
        this.updateQuoteBadge();
        this.openQuote();
    },

    submitQuote() {
        const name = document.getElementById('qName')?.value?.trim();
        const email = document.getElementById('qEmail')?.value?.trim();
        if (!name || !email) {
            this.toast('Please enter your name and email');
            return;
        }
        if (this.state.quoteList.length === 0) {
            this.toast('Please add at least one product');
            return;
        }
        this.toast('Quote request sent successfully!');
        this.state.quoteList = [];
        this.updateQuoteBadge();
        this.closeModal('quoteModal');
    },

    /* ── PRODUCT DETAIL ── */
    openDetail(id) {
        const product = PRODUCTS.find(p => p.id === id);
        if (!product) return;
        const modal = document.getElementById('productModal');
        if (!modal) return;

        const specsHtml = product.specs ? Object.entries(product.specs).map(([k, v]) =>
            `<div><span class="pd-spec-label">${k}</span><span class="pd-spec-val">${v}</span></div>`
        ).join('') : '';

        const related = PRODUCTS.filter(p => p.category === product.category && p.id !== product.id).slice(0, 3);
        const relatedHtml = related.length > 0 ? `
            <div class="related-section">
                <h3>Related Products</h3>
                <div class="related-grid">
                    ${related.map(r => `
                        <div class="related-card" onclick="App.openDetail(${r.id})">
                            <img src="${r.image}" alt="${r.name}">
                            <div>
                                <strong>${r.name}</strong>
                                <span>${r.category.replace('-', ' ')}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>` : '';

        modal.innerHTML = `
            <div class="modal-backdrop" onclick="App.closeModal('productModal')"></div>
            <div class="modal-content" style="max-width:900px;">
                <button class="modal-close" style="position:absolute;top:1rem;right:1.5rem;z-index:10;" onclick="App.closeModal('productModal')">×</button>
                <div class="pd-grid">
                    <div class="pd-img">
                        <img src="${product.image}" alt="${product.name}">
                    </div>
                    <div>
                        <span class="pd-cat">${product.category.replace('-', ' ')}</span>
                        <h1 class="pd-title">${product.name}</h1>
                        <p class="pd-tagline">${product.tagline}</p>
                        <p class="pd-desc">${product.description}</p>
                        <div class="pd-specs">${specsHtml}</div>
                        <div class="pd-actions">
                            <button class="pd-btn-quote" onclick="App.addToQuote(${product.id})">Request Quote</button>
                            <button class="pd-btn-compare" onclick="App.toggleCompare(${product.id})">+ Compare</button>
                        </div>
                    </div>
                </div>
                ${relatedHtml}
            </div>`;
        modal.classList.add('visible');
    },

    /* ── UTILITIES ── */
    closeModal(id) {
        const modal = document.getElementById(id);
        if (modal) modal.classList.remove('visible');
    },

    toggleMenu() {
        // Legacy support
        if (typeof toggleMobileMenu === 'function') toggleMobileMenu();
    },

    toast(msg) {
        const el = document.getElementById('toast');
        if (!el) return;
        el.textContent = msg;
        el.classList.add('visible');
        setTimeout(() => el.classList.remove('visible'), 2500);
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => App.init());
