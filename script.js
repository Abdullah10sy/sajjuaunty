/**
 * ===== RESPONSIVE AUTO-SWIPING IMAGE SLIDER =====
 * Production-ready image slider for e-commerce websites
 * Features: Auto-slide, pause on hover, error handling, responsive design
 */

class ResponsiveImageSlider {
    constructor(sliderId, options = {}) {
        // Configuration options with defaults
        this.options = {
            autoSlideInterval: options.autoSlideInterval || 4000, // 4 seconds
            transitionDuration: options.transitionDuration || 600, // 0.6 seconds
            pauseOnHover: options.pauseOnHover !== false, // Default true
            fallbackImage: options.fallbackImage || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBBdmFpbGFibGU8L3RleHQ+PC9zdmc+',
            ...options
        };
        
        // Get slider element
        this.slider = document.getElementById(sliderId);
        if (!this.slider) {
            console.error(`Slider with ID "${sliderId}" not found`);
            return;
        }
        
        // Initialize slider components
        this.slides = this.slider.querySelectorAll('.slide');
        this.dots = this.slider.querySelectorAll('.dot');
        this.prevBtn = this.slider.querySelector('.prev-btn');
        this.nextBtn = this.slider.querySelector('.next-btn');
        
        // Slider state
        this.currentSlide = 0;
        this.totalSlides = this.slides.length;
        this.autoSlideTimer = null;
        this.isTransitioning = false;
        this.imagesLoaded = new Set();
        
        // Initialize if we have slides
        if (this.totalSlides > 0) {
            this.init();
        }
    }
    
    /**
     * Initialize the slider
     */
    init() {
        console.log('Initializing ResponsiveImageSlider...');
        
        // Load images after DOM is ready
        this.loadImages();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Start auto-slide
        this.startAutoSlide();
        
        // Set initial state
        this.updateSlider();
        
        console.log('ResponsiveImageSlider initialized successfully');
    }
    
    /**
     * Load all images with proper error handling
     */
    loadImages() {
        this.slides.forEach((slide, index) => {
            const imageSrc = slide.dataset.src;
            const imageAlt = slide.dataset.alt || `Slide ${index + 1}`;
            
            if (!imageSrc) {
                console.warn(`No image source found for slide ${index}`);
                this.handleImageError(slide, index);
                return;
            }
            
            // Create image element
            const img = new Image();
            
            // Handle successful image load
            img.onload = () => {
                this.handleImageLoad(slide, img, index);
            };
            
            // Handle image load error
            img.onerror = () => {
                console.warn(`Failed to load image: ${imageSrc}`);
                this.handleImageError(slide, index);
            };
            
            // Set image properties
            img.src = imageSrc;
            img.alt = imageAlt;
            img.loading = 'lazy'; // Native lazy loading
        });
    }
    
    /**
     * Handle successful image load
     */
    handleImageLoad(slide, img, index) {
        // Remove loading indicator
        const loader = slide.querySelector('.slide-loader');
        if (loader) {
            loader.remove();
        }
        
        // Remove any existing images to prevent duplicates
        const existingImages = slide.querySelectorAll('img');
        existingImages.forEach(existingImg => existingImg.remove());
        
        // Add the new image to slide
        slide.appendChild(img);
        slide.classList.remove('error');
        this.imagesLoaded.add(index);
        
        console.log(`Image loaded successfully for slide ${index}`);
    }
    
    /**
     * Handle image load error with fallback
     */
    handleImageError(slide, index) {
        // Remove loading indicator
        const loader = slide.querySelector('.slide-loader');
        if (loader) {
            loader.remove();
        }
        
        // Create fallback image
        const fallbackImg = new Image();
        fallbackImg.src = this.options.fallbackImage;
        fallbackImg.alt = `Fallback image for slide ${index + 1}`;
        fallbackImg.onload = () => {
            slide.appendChild(fallbackImg);
            slide.classList.add('error');
        };
        
        // If fallback also fails, show text
        fallbackImg.onerror = () => {
            slide.innerHTML = '<div class="slide-loader">Image not available</div>';
            slide.classList.add('error');
        };
        
        console.log(`Using fallback for slide ${index}`);
    }
    
    /**
     * Set up all event listeners
     */
    setupEventListeners() {
        // Navigation buttons
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => this.prevSlide());
        }
        
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => this.nextSlide());
        }
        
        // Dot indicators
        this.dots.forEach((dot, index) => {
            dot.addEventListener('click', () => this.goToSlide(index));
        });
        
        // Pause on hover
        if (this.options.pauseOnHover) {
            this.slider.addEventListener('mouseenter', () => this.pauseAutoSlide());
            this.slider.addEventListener('mouseleave', () => this.resumeAutoSlide());
        }
        
        // Touch/swipe support
        this.setupTouchEvents();
        
        // Keyboard navigation
        this.setupKeyboardEvents();
        
        // Visibility change (pause when tab is not active)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAutoSlide();
            } else {
                this.resumeAutoSlide();
            }
        });
    }
    
    /**
     * Set up touch/swipe events for mobile
     */
    setupTouchEvents() {
        let startX = 0;
        let startY = 0;
        let isSwipe = false;
        
        this.slider.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isSwipe = false;
            this.pauseAutoSlide();
        }, { passive: true });
        
        this.slider.addEventListener('touchmove', (e) => {
            if (!startX || !startY) return;
            
            const diffX = Math.abs(e.touches[0].clientX - startX);
            const diffY = Math.abs(e.touches[0].clientY - startY);
            
            // Detect horizontal swipe
            if (diffX > diffY && diffX > 30) {
                isSwipe = true;
                e.preventDefault(); // Prevent scrolling
            }
        }, { passive: false });
        
        this.slider.addEventListener('touchend', (e) => {
            if (!startX || !isSwipe) {
                this.resumeAutoSlide();
                return;
            }
            
            const endX = e.changedTouches[0].clientX;
            const diffX = startX - endX;
            
            // Swipe threshold
            if (Math.abs(diffX) > 50) {
                if (diffX > 0) {
                    this.nextSlide();
                } else {
                    this.prevSlide();
                }
            }
            
            // Reset values
            startX = 0;
            startY = 0;
            isSwipe = false;
            this.resumeAutoSlide();
        }, { passive: true });
    }
    
    /**
     * Set up keyboard navigation
     */
    setupKeyboardEvents() {
        this.slider.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.prevSlide();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.nextSlide();
                    break;
                case ' ': // Spacebar
                    e.preventDefault();
                    this.toggleAutoSlide();
                    break;
            }
        });
        
        // Make slider focusable
        this.slider.setAttribute('tabindex', '0');
    }
    
    /**
     * Go to next slide
     */
    nextSlide() {
        if (this.isTransitioning) return;
        
        const nextIndex = (this.currentSlide + 1) % this.totalSlides;
        this.goToSlide(nextIndex);
    }
    
    /**
     * Go to previous slide
     */
    prevSlide() {
        if (this.isTransitioning) return;
        
        const prevIndex = this.currentSlide === 0 ? this.totalSlides - 1 : this.currentSlide - 1;
        this.goToSlide(prevIndex);
    }
    
    /**
     * Go to specific slide
     */
    goToSlide(index) {
        if (this.isTransitioning || index === this.currentSlide || index < 0 || index >= this.totalSlides) {
            return;
        }
        
        this.isTransitioning = true;
        this.currentSlide = index;
        this.updateSlider();
        
        // Reset transition lock after animation
        setTimeout(() => {
            this.isTransitioning = false;
        }, this.options.transitionDuration);
    }
    
    /**
     * Update slider display
     */
    updateSlider() {
        // Update slides
        this.slides.forEach((slide, index) => {
            slide.classList.toggle('active', index === this.currentSlide);
        });
        
        // Update dots
        this.dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentSlide);
        });
        
        // Update ARIA attributes for accessibility
        this.updateAriaAttributes();
    }
    
    /**
     * Update ARIA attributes for accessibility
     */
    updateAriaAttributes() {
        this.slides.forEach((slide, index) => {
            slide.setAttribute('aria-hidden', index !== this.currentSlide);
        });
        
        this.dots.forEach((dot, index) => {
            dot.setAttribute('aria-pressed', index === this.currentSlide);
        });
    }
    
    /**
     * Start auto-slide
     */
    startAutoSlide() {
        if (this.totalSlides <= 1) return;
        
        this.autoSlideTimer = setInterval(() => {
            this.nextSlide();
        }, this.options.autoSlideInterval);
    }
    
    /**
     * Pause auto-slide
     */
    pauseAutoSlide() {
        if (this.autoSlideTimer) {
            clearInterval(this.autoSlideTimer);
            this.autoSlideTimer = null;
        }
    }
    
    /**
     * Resume auto-slide
     */
    resumeAutoSlide() {
        if (!this.autoSlideTimer && this.totalSlides > 1) {
            this.startAutoSlide();
        }
    }
    
    /**
     * Toggle auto-slide
     */
    toggleAutoSlide() {
        if (this.autoSlideTimer) {
            this.pauseAutoSlide();
        } else {
            this.resumeAutoSlide();
        }
    }
    
    /**
     * Destroy slider and clean up
     */
    destroy() {
        this.pauseAutoSlide();
        console.log('ResponsiveImageSlider destroyed');
    }
}

// Initialize slider when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the main product slider
    window.productSlider = new ResponsiveImageSlider('product-slider', {
        autoSlideInterval: 4000, // 4 seconds
        transitionDuration: 600,  // 0.6 seconds
        pauseOnHover: true
    });
    
    // Initialize the perfumed creams slider
    window.creamsSlider = new ResponsiveImageSlider('creams-slider', {
        autoSlideInterval: 5000, // 5 seconds
        transitionDuration: 600,  // 0.6 seconds
        pauseOnHover: true
    });
    
    console.log('Product slider and creams slider initialized');
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (window.productSlider) {
        window.productSlider.destroy();
    }
    if (window.creamsSlider) {
        window.creamsSlider.destroy();
    }
});

document.addEventListener('DOMContentLoaded', function () {
  // --- Carousel (runs only when a carousel exists on the page) ---
  const carousel = document.querySelector('.carousel');
  if (carousel) {
    const track = carousel.querySelector('.carousel-track');
    const slides = Array.from(track.children);
    const nextBtn = carousel.querySelector('.carousel-btn.next');
    const prevBtn = carousel.querySelector('.carousel-btn.prev');
    const dots = Array.from(carousel.querySelectorAll('.carousel-dots .dot'));

    let index = 0;
    const total = slides.length;
    let auto;

    function update() {
      track.style.transform = `translateX(-${index * 100}%)`;
      slides.forEach((s, i) => s.classList.toggle('active', i === index));
      dots.forEach((d, i) => d.classList.toggle('active', i === index));
    }

    function goTo(n) {
      index = (n + total) % total;
      update();
    }

    nextBtn && nextBtn.addEventListener('click', () => { goTo(index + 1); resetAuto(); });
    prevBtn && prevBtn.addEventListener('click', () => { goTo(index - 1); resetAuto(); });

    dots.forEach((dot, i) => dot.addEventListener('click', () => { goTo(i); resetAuto(); }));

    function startAuto() {
      auto = setInterval(() => { goTo(index + 1); }, 5000);
    }

    function resetAuto() {
      clearInterval(auto);
      startAuto();
    }

    carousel.addEventListener('mouseenter', () => clearInterval(auto));
    carousel.addEventListener('mouseleave', () => resetAuto());

    update();
    startAuto();
  }

  // --- Products / Filters & Product Modal ---
  const products = [
    {
      id: 'amplifier',
      name: 'Amplifier',
      category: 'fragrance',
      images: ['Perfume/Amplifier.jpg'],
      price: '₹1499',
      description: 'A bold, long-lasting scent that opens with bright citrus and dries to warm amber and woods.',
      ingredients: 'Top: Citrus | Heart: Tuberose | Base: Amber, Woods',
      buyUrl: '#'
    },
    {
      id: 'eau-de-parfum',
      name: 'Eau de Parfum',
      category: 'fragrance',
      images: ['Perfume/Eau de Parfum2.jpg'],
      price: '₹2499',
      description: 'A refined Eau de Parfum with floral heart and powdery vanilla base—timeless and elegant.',
      ingredients: 'Top: Bergamot | Heart: Rose, Jasmine | Base: Vanilla',
      buyUrl: '#'
    },
    {
      id: 'miss-giordani',
      name: 'Miss Giordani Eau de Parfum',
      category: 'fragrance',
      images: ['Perfume/Miss Giordani Eau de Parfum2.jpg'],
      price: '₹3499',
      description: 'A feminine, sophisticated scent with fruity top notes and a velvety floral dry-down.',
      ingredients: 'Top: Pear | Heart: Orange Blossom | Base: Musk',
      buyUrl: '#'
    },
    {
      id: 'mythical-seduction',
      name: 'Mythical Seduction Fragrance Mist',
      category: 'fragrance',
      images: ['Perfume/Mythical Seduction Fragrance Mist2.jpg'],
      price: '₹1299',
      description: 'A light fragrance mist perfect for quick refreshes—airy and playful.',
      ingredients: 'Top: Berries | Heart: Peony | Base: Soft Musk',
      buyUrl: '#'
    },
    {
      id: 'perfumed-roll-on',
      name: 'Perfumed Roll-On Deodorant',
      category: 'fragrance',
      images: ['Perfume/Perfumed Roll-On Deodorant2.jpg'],
      price: '₹999',
      description: 'An easy-to-use roll-on with a subtle, long-lasting scent and gentle formula.',
      ingredients: 'Aluminum-free | Fragrance: Soft Floral',
      buyUrl: '#'
    }
  ];

  // Open product detail when thumbnail is clicked
  document.querySelectorAll('.thumbnail-item').forEach(li => {
    li.addEventListener('click', (e) => {
      // If the user clicked an Add-to-cart button, do not open modal (button stops propagation anyway)
      const id = li.dataset.productId || li.querySelector('.thumb-add-btn')?.dataset?.id;
      if (!id) return;
      const p = products.find(x => x.id === id);
      if (p) showProduct(p);
    });
  });

  const productsGrid = document.getElementById('products-grid');
  const filterButtons = document.querySelectorAll('.filter-btn');
  const productModal = document.getElementById('product-modal');
  const productDetailEl = document.getElementById('product-detail');
  const closeProduct = document.getElementById('close-product');

  function renderProducts(list) {
    if (!productsGrid) return;
    productsGrid.innerHTML = '';

    if (!list.length) {
      productsGrid.innerHTML = '<p>No products found.</p>';
      return;
    }

    list.forEach(p => {
      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        <div class="product-image">
          <img src="${p.images ? p.images[0] : p.image}" alt="${p.name}">
        </div>
        <div class="product-info">
          <h3 class="product-name">${p.name}</h3>
          <p class="product-price">${p.price}</p>
          <div style="margin-top:8px; display:flex; gap:8px;">
            <button class="btn btn-primary view-btn">View</button>
            <a class="btn" href="${p.buyUrl}" target="_blank" rel="noopener">Buy Now</a>
          </div>
        </div>
      `;

      // View button opens product modal
      card.querySelector('.view-btn').addEventListener('click', () => showProduct(p));
      productsGrid.appendChild(card);
    });
  }

  // Initial render: apply optional URL filter (e.g. index.html?filter=skincare)
  const urlParams = new URLSearchParams(window.location.search);
  // Support a data-default-filter on the <body> for dedicated category pages
  const bodyDefaultFilter = document.body && document.body.dataset ? document.body.dataset.defaultFilter : null;
  const initialFilter = urlParams.get('filter') || bodyDefaultFilter;

  if (initialFilter) {
    // Apply matching filter button if available
    const btn = Array.from(filterButtons).find(b => b.getAttribute('data-filter') === initialFilter);
    if (btn) {
      btn.classList.add('active');
      const filter = btn.getAttribute('data-filter');
      const filtered = filter === 'all' ? products : products.filter(p => p.category === filter);
      renderProducts(filtered);
    } else {
      renderProducts(products);
    }
  } else {
    renderProducts(products);
  }

  // Filter buttons
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.getAttribute('data-filter');
      if (filter === 'all') {
        renderProducts(products);
      } else {
        const filtered = products.filter(p => p.category === filter);
        renderProducts(filtered);
      }
    });
  });

  // Show product in modal
  function showProduct(p) {
    if (!productModal || !productDetailEl) return;

    productDetailEl.innerHTML = `
      <div class="product-gallery">
        <img id="product-main-image" src="${p.images ? p.images[0] : p.image}" alt="${p.name}">
        ${p.images && p.images.length > 1 ? `
          <div class="product-thumbs" style="margin-top:8px;display:flex;gap:8px;">
            ${p.images.map((img, i) => `<img class="product-thumb" src="${img}" data-index="${i}" alt="${p.name} ${i+1}" style="width:80px;height:80px;object-fit:cover;border:1px solid #ddd;cursor:pointer;">`).join('')}
          </div>
        ` : ''}
      </div>
      <div class="product-details">
        <h2>${p.name}</h2>
        <p class="product-price-detail">${p.price}</p>
        <p class="product-description">${p.description}</p>
        <div class="product-ingredients">
          <h4>Notes & Ingredients</h4>
          <p>${p.ingredients}</p>
        </div>
        <div style="display:flex;gap:8px;align-items:center;">
          <a class="btn btn-primary" href="${p.buyUrl}" target="_blank" rel="noopener">Buy Now</a>
          <button class="btn" id="close-from-modal">Close</button>
        </div>
      </div>
    `;

    productModal.style.display = 'block';

    // Wire up thumbnail clicks to swap main image
    const mainImg = document.getElementById('product-main-image');
    document.querySelectorAll('.product-thumb').forEach(t => {
      t.addEventListener('click', () => {
        if (mainImg) mainImg.src = t.src;
      });
    });

    productModal.style.display = 'block';

    // Close inside modal
    const closeFromModal = document.getElementById('close-from-modal');
    closeFromModal && closeFromModal.addEventListener('click', closeProductModal);
  }

  function closeProductModal() {
    if (!productModal) return;
    productModal.style.display = 'none';
    productDetailEl.innerHTML = '';
  }

  // Close handlers
  closeProduct && closeProduct.addEventListener('click', closeProductModal);
  productModal && productModal.addEventListener('click', (e) => {
    if (e.target === productModal) closeProductModal();
  });

  /* -------------------- Cart handling -------------------- */
  function getCart() {
    try {
      return JSON.parse(localStorage.getItem('cart') || '{}');
    } catch (e) {
      return {};
    }
  }

  function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCountUI();
  }

  function getCartCount() {
    const cart = getCart();
    return Object.values(cart).reduce((sum, item) => sum + (item.qty || 0), 0);
  }

  function updateCartCountUI() {
    const el = document.getElementById('cart-count');
    if (el) el.textContent = getCartCount();
  }

  function formatRupee(n) {
    return '₹' + Number(n).toLocaleString('en-IN');
  }

  function showCartToast(text) {
    let toast = document.querySelector('.cart-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'cart-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = text;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 1500);
  }

  function addToCart(id, name, price, qty = 1) {
    const cart = getCart();
    if (!cart[id]) cart[id] = { id, name, price: Number(price), qty: 0 };
    cart[id].qty += qty;
    saveCart(cart);
    showCartToast(`${name} added to cart`);
  }

  // Wire up thumbnail Add-to-cart buttons (if present)
  document.querySelectorAll('.thumb-add-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = btn.dataset.id;
      const name = btn.dataset.name || 'Item';
      const price = btn.dataset.price || 0;
      addToCart(id, name, price, 1);
      e.stopPropagation();
    });
  });

  // Cart modal UI
  function buildCartModal() {
    let overlay = document.querySelector('.cart-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'cart-overlay';
      overlay.innerHTML = `
        <div class="cart-modal" role="dialog" aria-modal="true">
          <h4>Your Cart</h4>
          <div class="cart-items"></div>
          <div class="cart-total">Total: ₹0</div>
          <div class="cart-actions">
            <button class="btn" id="close-cart">Close</button>
            <button class="btn btn-primary" id="checkout-btn">Checkout</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeCartModal();
      });

      overlay.querySelector('#close-cart').addEventListener('click', closeCartModal);

      overlay.querySelector('#checkout-btn').addEventListener('click', () => {
        alert('Checkout flow not implemented. Cart preserved in localStorage.');
      });
    }
    return overlay;
  }

  function openCartModal() {
    const overlay = buildCartModal();
    const itemsEl = overlay.querySelector('.cart-items');
    const totalEl = overlay.querySelector('.cart-total');

    const cart = getCart();
    itemsEl.innerHTML = '';

    const ids = Object.keys(cart);
    if (!ids.length) {
      itemsEl.innerHTML = '<p>Your cart is empty.</p>';
      totalEl.textContent = 'Total: ₹0';
    } else {
      let total = 0;
      ids.forEach(id => {
        const it = cart[id];
        const lineTotal = it.price * it.qty;
        total += lineTotal;
        const row = document.createElement('div');
        row.className = 'cart-item';
        row.dataset.id = id;
        row.innerHTML = `
          <div class="meta">
            <strong>${it.name}</strong>
            <div class="price">${formatRupee(it.price)} each</div>
          </div>
          <div class="qty-controls">
            <button class="btn" data-action="dec">-</button>
            <div class="qty">${it.qty}</div>
            <button class="btn" data-action="inc">+</button>
            <div class="line">${formatRupee(lineTotal)}</div>
            <button class="btn" data-action="remove">Remove</button>
          </div>
        `;
        itemsEl.appendChild(row);

        row.querySelector('[data-action="dec"]').addEventListener('click', () => updateQty(id, -1));
        row.querySelector('[data-action="inc"]').addEventListener('click', () => updateQty(id, 1));
        row.querySelector('[data-action="remove"]').addEventListener('click', () => removeItem(id));
      });
      totalEl.textContent = `Total: ${formatRupee(total)}`;
    }

    overlay.classList.add('show');
  }

  function closeCartModal() {
    const overlay = document.querySelector('.cart-overlay');
    if (overlay) overlay.classList.remove('show');
  }

  function updateQty(id, delta) {
    const cart = getCart();
    if (!cart[id]) return;
    cart[id].qty += delta;
    if (cart[id].qty <= 0) delete cart[id];
    saveCart(cart);
    openCartModal(); // refresh
  }

  function removeItem(id) {
    const cart = getCart();
    if (!cart[id]) return;
    delete cart[id];
    saveCart(cart);
    openCartModal();
  }

  // Wire up cart button
  const cartBtn = document.getElementById('cart-btn');
  cartBtn && cartBtn.addEventListener('click', openCartModal);

  // Initialize cart count on load
  updateCartCountUI();

});
// Perfume Image Auto-Swipe Functionality
class PerfumeCarousel {
    constructor() {
        this.carousels = [];
        this.autoSwipeInterval = 3000; // 3 seconds
        this.init();
    }

    init() {
        // Find all perfume cards with image carousels
        const perfumeCards = document.querySelectorAll('.perfume-card');
        
        perfumeCards.forEach((card, index) => {
            const carousel = {
                card: card,
                images: card.querySelectorAll('.perfume-img'),
                dots: card.querySelectorAll('.perfume-dot'),
                currentIndex: 0,
                intervalId: null,
                isPaused: false
            };

            if (carousel.images.length > 1) {
                this.carousels.push(carousel);
                this.setupCarousel(carousel, index);
                this.startAutoSwipe(carousel);
            }
        });
    }

    setupCarousel(carousel, carouselIndex) {
        // Add click handlers for dots
        carousel.dots.forEach((dot, index) => {
            dot.addEventListener('click', (e) => {
                e.stopPropagation();
                this.goToSlide(carousel, index);
                this.resetAutoSwipe(carousel);
            });
        });

        // Add hover pause functionality
        carousel.card.addEventListener('mouseenter', () => {
            this.pauseAutoSwipe(carousel);
        });

        carousel.card.addEventListener('mouseleave', () => {
            this.resumeAutoSwipe(carousel);
        });

        // Add touch/click functionality for manual swiping
        let startX = 0;
        let startY = 0;
        let isSwipe = false;

        const imageCarousel = carousel.card.querySelector('.perfume-image-carousel');

        imageCarousel.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isSwipe = false;
            this.pauseAutoSwipe(carousel);
        });

        imageCarousel.addEventListener('touchmove', (e) => {
            if (!startX || !startY) return;
            
            const diffX = Math.abs(e.touches[0].clientX - startX);
            const diffY = Math.abs(e.touches[0].clientY - startY);
            
            if (diffX > diffY && diffX > 30) {
                isSwipe = true;
                e.preventDefault();
            }
        });

        imageCarousel.addEventListener('touchend', (e) => {
            if (!startX || !isSwipe) {
                this.resumeAutoSwipe(carousel);
                return;
            }

            const endX = e.changedTouches[0].clientX;
            const diffX = startX - endX;

            if (Math.abs(diffX) > 50) {
                if (diffX > 0) {
                    this.nextSlide(carousel);
                } else {
                    this.prevSlide(carousel);
                }
            }

            startX = 0;
            startY = 0;
            isSwipe = false;
            this.resetAutoSwipe(carousel);
        });

        // Add click to advance functionality
        imageCarousel.addEventListener('click', (e) => {
            if (!isSwipe) {
                this.nextSlide(carousel);
                this.resetAutoSwipe(carousel);
            }
        });
    }

    goToSlide(carousel, index) {
        // Remove active class from current image and dot
        carousel.images[carousel.currentIndex].classList.remove('active');
        carousel.dots[carousel.currentIndex].classList.remove('active');

        // Update current index
        carousel.currentIndex = index;

        // Add active class to new image and dot
        carousel.images[carousel.currentIndex].classList.add('active');
        carousel.dots[carousel.currentIndex].classList.add('active');
    }

    nextSlide(carousel) {
        const nextIndex = (carousel.currentIndex + 1) % carousel.images.length;
        this.goToSlide(carousel, nextIndex);
    }

    prevSlide(carousel) {
        const prevIndex = carousel.currentIndex === 0 
            ? carousel.images.length - 1 
            : carousel.currentIndex - 1;
        this.goToSlide(carousel, prevIndex);
    }

    startAutoSwipe(carousel) {
        if (carousel.intervalId) {
            clearInterval(carousel.intervalId);
        }

        carousel.intervalId = setInterval(() => {
            if (!carousel.isPaused) {
                this.nextSlide(carousel);
            }
        }, this.autoSwipeInterval);
    }

    pauseAutoSwipe(carousel) {
        carousel.isPaused = true;
    }

    resumeAutoSwipe(carousel) {
        carousel.isPaused = false;
    }

    resetAutoSwipe(carousel) {
        this.startAutoSwipe(carousel);
        carousel.isPaused = false;
    }

    stopAllCarousels() {
        this.carousels.forEach(carousel => {
            if (carousel.intervalId) {
                clearInterval(carousel.intervalId);
            }
        });
    }
}

// Initialize perfume carousels when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add a small delay to ensure all images are loaded
    setTimeout(() => {
        window.perfumeCarousel = new PerfumeCarousel();
    }, 500);
});

// Clean up intervals when page is unloaded
window.addEventListener('beforeunload', () => {
    if (window.perfumeCarousel) {
        window.perfumeCarousel.stopAllCarousels();
    }
});

// Pause carousels when page is not visible (performance optimization)
document.addEventListener('visibilitychange', () => {
    if (window.perfumeCarousel) {
        window.perfumeCarousel.carousels.forEach(carousel => {
            if (document.hidden) {
                carousel.isPaused = true;
            } else {
                carousel.isPaused = false;
            }
        });
    }
});
// Body Mist Collection Carousel Functionality
class MainCarousel {
    constructor(carouselId) {
        this.carousel = document.getElementById(carouselId);
        if (!this.carousel) return;
        
        this.track = this.carousel.querySelector('.carousel-track');
        this.slides = this.carousel.querySelectorAll('.carousel-slide');
        this.prevBtn = this.carousel.querySelector('.carousel-btn.prev');
        this.nextBtn = this.carousel.querySelector('.carousel-btn.next');
        this.dots = this.carousel.querySelectorAll('.dot');
        
        this.currentIndex = 0;
        this.totalSlides = this.slides.length;
        
        if (this.totalSlides > 0) {
            this.init();
        }
    }
    
    init() {
        // Set initial positions
        this.setInitialState();
        this.updateCarousel();
        
        // Add event listeners
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => this.prevSlide());
        }
        
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => this.nextSlide());
        }
        
        // Add dot click handlers
        this.dots.forEach((dot, index) => {
            dot.addEventListener('click', () => this.goToSlide(index));
        });
        
        // Add keyboard navigation
        this.carousel.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                this.prevSlide();
            } else if (e.key === 'ArrowRight') {
                this.nextSlide();
            }
        });
        
        // Add touch/swipe support
        this.addTouchSupport();
        
        // Auto-play functionality (optional)
        this.startAutoPlay();
    }
    
    setInitialState() {
        // Ensure all slides are properly positioned initially
        this.slides.forEach((slide, index) => {
            slide.style.position = 'absolute';
            slide.style.top = '0';
            slide.style.left = '0';
            slide.style.width = '100%';
            slide.style.height = '100%';
            
            if (index === 0) {
                slide.style.opacity = '1';
                slide.classList.add('active');
            } else {
                slide.style.opacity = '0';
                slide.classList.remove('active');
            }
        });
        
        // Set first dot as active
        this.dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === 0);
        });
    }
    
    updateCarousel() {
        // Simple fade-based carousel
        this.slides.forEach((slide, index) => {
            if (index === this.currentIndex) {
                slide.style.opacity = '1';
                slide.classList.add('active');
            } else {
                slide.style.opacity = '0';
                slide.classList.remove('active');
            }
        });
        
        // Update dots
        this.dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentIndex);
        });
    }
    
    goToSlide(index) {
        this.currentIndex = index;
        this.updateCarousel();
    }
    
    nextSlide() {
        this.currentIndex = (this.currentIndex + 1) % this.totalSlides;
        this.updateCarousel();
    }
    
    prevSlide() {
        this.currentIndex = this.currentIndex === 0 ? this.totalSlides - 1 : this.currentIndex - 1;
        this.updateCarousel();
    }
    
    addTouchSupport() {
        let startX = 0;
        let startY = 0;
        let isSwipe = false;
        
        this.carousel.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isSwipe = false;
        });
        
        this.carousel.addEventListener('touchmove', (e) => {
            if (!startX || !startY) return;
            
            const diffX = Math.abs(e.touches[0].clientX - startX);
            const diffY = Math.abs(e.touches[0].clientY - startY);
            
            if (diffX > diffY && diffX > 30) {
                isSwipe = true;
                e.preventDefault();
            }
        });
        
        this.carousel.addEventListener('touchend', (e) => {
            if (!startX || !isSwipe) return;
            
            const endX = e.changedTouches[0].clientX;
            const diffX = startX - endX;
            
            if (Math.abs(diffX) > 50) {
                if (diffX > 0) {
                    this.nextSlide();
                } else {
                    this.prevSlide();
                }
            }
            
            startX = 0;
            startY = 0;
            isSwipe = false;
        });
    }
    
    startAutoPlay() {
        // Auto-play every 5 seconds (optional)
        setInterval(() => {
            this.nextSlide();
        }, 5000);
    }
    
    // Method to stop auto-play if needed
    stopAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
        }
    }
}

// Initialize carousels when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize main fragrance carousel
    window.mainCarousel = new MainCarousel('main-carousel');
    
    // Initialize body mist carousel
    window.mistCarousel = new MainCarousel('mist-carousel');
    
    // Add a small delay to ensure all elements are properly loaded
    setTimeout(() => {
        // Re-initialize if needed
        if (!window.mainCarousel && document.getElementById('main-carousel')) {
            window.mainCarousel = new MainCarousel('main-carousel');
        }
        
        if (!window.mistCarousel && document.getElementById('mist-carousel')) {
            window.mistCarousel = new MainCarousel('mist-carousel');
        }
    }, 1000);
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (window.mainCarousel) {
        window.mainCarousel.stopAutoPlay();
    }
    if (window.mistCarousel) {
        window.mistCarousel.stopAutoPlay();
    }
});
// Debug function to test slider functionality
window.testSlider = function() {
    if (window.productSlider) {
        console.log('Testing slider navigation...');
        console.log('Current slide:', window.productSlider.currentSlide);
        console.log('Total slides:', window.productSlider.totalSlides);
        
        // Test next slide
        setTimeout(() => {
            window.productSlider.nextSlide();
            console.log('Moved to slide:', window.productSlider.currentSlide);
        }, 1000);
    } else {
        console.log('Slider not initialized');
    }
};

// Enhanced initialization with better error handling
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const sliderElement = document.getElementById('product-slider');
        if (sliderElement) {
            const slides = sliderElement.querySelectorAll('.slide');
            console.log(`Found ${slides.length} slides`);
            
            slides.forEach((slide, index) => {
                console.log(`Slide ${index}:`, slide.dataset.src, slide.dataset.alt);
            });
            
            // Ensure first slide is active
            slides.forEach((slide, index) => {
                slide.classList.toggle('active', index === 0);
            });
            
            console.log('Slider setup complete');
        }
    }, 500);
});
// ===== FIXED ADD TO CART BUTTON FUNCTIONALITY =====

// Initialize all add to cart buttons when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Add to Cart buttons...');
    
    // Wait a bit for all elements to be fully loaded
    setTimeout(() => {
        initializeAddToCartButtons();
    }, 1000);
});

function initializeAddToCartButtons() {
    // Find all add to cart buttons
    const addToCartButtons = document.querySelectorAll('.perfume-add-btn');
    console.log(`Found ${addToCartButtons.length} Add to Cart buttons`);
    
    addToCartButtons.forEach((btn, index) => {
        console.log(`Initializing button ${index + 1}:`, {
            id: btn.dataset.id,
            name: btn.dataset.name,
            price: btn.dataset.price
        });
        
        // Remove any existing event listeners
        btn.removeEventListener('click', handleAddToCart);
        
        // Add new event listener
        btn.addEventListener('click', handleAddToCart);
        
        // Add visual feedback on hover
        btn.addEventListener('mouseenter', () => {
            btn.style.transform = 'translateY(-1px)';
            btn.style.boxShadow = '0 6px 20px rgba(30, 58, 138, 0.4)';
        });
        
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = '';
            btn.style.boxShadow = '';
        });
    });
    
    console.log('All Add to Cart buttons initialized successfully');
}

function handleAddToCart(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const btn = event.target;
    const id = btn.dataset.id;
    const name = btn.dataset.name;
    const price = btn.dataset.price;
    
    console.log('Add to Cart clicked:', { id, name, price });
    
    if (!id || !name || !price) {
        console.error('Missing product data:', { id, name, price });
        alert('Error: Product information is missing');
        return;
    }
    
    // Add visual feedback
    btn.style.transform = 'scale(0.95)';
    btn.style.background = '#1d4ed8';
    
    const originalText = btn.textContent;
    btn.textContent = 'Adding...';
    btn.disabled = true;
    
    // Add to cart
    try {
        addToCart(id, name, price, 1);
        
        // Success feedback
        btn.textContent = 'Added!';
        btn.style.background = '#059669'; // Green for success
        
        // Show success toast
        showCartToast(`${name} added to cart!`);
        
        // Reset button after 1.5 seconds
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.transform = '';
            btn.style.background = '#1e3a8a';
            btn.disabled = false;
        }, 1500);
        
    } catch (error) {
        console.error('Error adding to cart:', error);
        
        // Error feedback
        btn.textContent = 'Error!';
        btn.style.background = '#dc2626'; // Red for error
        
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.transform = '';
            btn.style.background = '#1e3a8a';
            btn.disabled = false;
        }, 1500);
    }
}

// Enhanced cart toast function
function showCartToast(message) {
    // Remove existing toast
    const existingToast = document.querySelector('.cart-toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'cart-toast';
    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
            <span style="color: #059669; font-size: 1.2rem;">✓</span>
            <span>${message}</span>
        </div>
    `;
    
    // Style the toast
    Object.assign(toast.style, {
        position: 'fixed',
        top: '100px',
        right: '20px',
        background: '#1e3a8a',
        color: 'white',
        padding: '12px 20px',
        borderRadius: '25px',
        boxShadow: '0 4px 20px rgba(30, 58, 138, 0.3)',
        zIndex: '10000',
        transform: 'translateX(100%)',
        transition: 'all 0.3s ease',
        fontWeight: '500',
        fontSize: '0.9rem'
    });
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 100);
    
    // Animate out and remove
    setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// Make sure cart functions are available
function ensureCartFunctions() {
    // If addToCart function doesn't exist, create it
    if (typeof addToCart !== 'function') {
        window.addToCart = function(id, name, price, qty = 1) {
            const cart = getCart();
            if (!cart[id]) {
                cart[id] = { id, name, price: Number(price), qty: 0 };
            }
            cart[id].qty += qty;
            saveCart(cart);
            updateCartCountUI();
        };
    }
    
    // If getCart function doesn't exist, create it
    if (typeof getCart !== 'function') {
        window.getCart = function() {
            try {
                return JSON.parse(localStorage.getItem('cart') || '{}');
            } catch (e) {
                return {};
            }
        };
    }
    
    // If saveCart function doesn't exist, create it
    if (typeof saveCart !== 'function') {
        window.saveCart = function(cart) {
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartCountUI();
        };
    }
    
    // If updateCartCountUI function doesn't exist, create it
    if (typeof updateCartCountUI !== 'function') {
        window.updateCartCountUI = function() {
            const cartCount = document.getElementById('cart-count');
            if (cartCount) {
                const cart = getCart();
                const count = Object.values(cart).reduce((sum, item) => sum + (item.qty || 0), 0);
                cartCount.textContent = count;
                
                // Add animation
                cartCount.style.transform = 'scale(1.2)';
                setTimeout(() => {
                    cartCount.style.transform = '';
                }, 200);
            }
        };
    }
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    ensureCartFunctions();
    
    // Initialize cart count
    updateCartCountUI();
    
    console.log('Cart system initialized');
});

// ===== ADDITIONAL BUTTON FUNCTIONALITY =====

function initializeProductButtons() {
    // Handle Buy Now buttons
    document.querySelectorAll('.btn-primary').forEach(btn => {
        if (btn.textContent.includes('Buy Now') || btn.href === '#') {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Add visual feedback
                btn.style.transform = 'scale(0.95)';
                
                // Show purchase dialog
                setTimeout(() => {
                    alert('Purchase functionality would be implemented here. This is a demo.');
                    btn.style.transform = '';
                }, 150);
            });
        }
    });
    
    // Handle Shop Creams buttons
    document.querySelectorAll('.btn-primary').forEach(btn => {
        if (btn.textContent.includes('Shop Creams')) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Add visual feedback
                btn.style.transform = 'scale(0.95)';
                
                // Scroll to creams section or show shop dialog
                setTimeout(() => {
                    const creamsSection = document.querySelector('.creams-box');
                    if (creamsSection) {
                        creamsSection.scrollIntoView({ behavior: 'smooth' });
                    } else {
                        alert('Shop Creams functionality would be implemented here. This is a demo.');
                    }
                    btn.style.transform = '';
                }, 150);
            });
        }
    });
    
    // Handle Back buttons
    document.querySelectorAll('.btn-secondary').forEach(btn => {
        if (btn.textContent.includes('Back')) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Add visual feedback
                btn.style.transform = 'scale(0.95)';
                
                // Navigate back
                setTimeout(() => {
                    if (btn.href && btn.href.includes('index.html')) {
                        window.location.href = 'index.html';
                    } else {
                        window.history.back();
                    }
                    btn.style.transform = '';
                }, 150);
            });
        }
    });
}

function initializeCartButtons() {
    // Ensure cart button is functional
    const cartBtn = document.getElementById('cart-btn');
    if (cartBtn && !cartBtn.hasAttribute('data-initialized')) {
        cartBtn.setAttribute('data-initialized', 'true');
        cartBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Add visual feedback
            cartBtn.style.transform = 'scale(0.95)';
            
            setTimeout(() => {
                openCartModal();
                cartBtn.style.transform = '';
            }, 150);
        });
    }
}

// ===== SIMPLIFIED WORKING CART FUNCTIONALITY =====

// Global cart functions
window.cart = {
    items: {},
    
    // Get cart from localStorage
    getCart: function() {
        try {
            return JSON.parse(localStorage.getItem('cart') || '{}');
        } catch (e) {
            return {};
        }
    },
    
    // Save cart to localStorage
    saveCart: function(cartData) {
        localStorage.setItem('cart', JSON.stringify(cartData));
        this.updateCartCount();
    },
    
    // Add item to cart
    addItem: function(id, name, price, qty = 1) {
        const cartData = this.getCart();
        if (!cartData[id]) {
            cartData[id] = { id, name, price: Number(price), qty: 0 };
        }
        cartData[id].qty += qty;
        this.saveCart(cartData);
        this.showToast(`${name} added to cart!`);
    },
    
    // Update cart count in UI
    updateCartCount: function() {
        const cartData = this.getCart();
        const count = Object.values(cartData).reduce((sum, item) => sum + (item.qty || 0), 0);
        const countEl = document.getElementById('cart-count');
        if (countEl) {
            countEl.textContent = count;
            // Add bounce animation
            countEl.style.transform = 'scale(1.2)';
            setTimeout(() => {
                countEl.style.transform = '';
            }, 200);
        }
    },
    
    // Show toast notification
    showToast: function(message) {
        // Remove existing toast
        const existingToast = document.querySelector('.cart-toast');
        if (existingToast) {
            existingToast.remove();
        }
        
        const toast = document.createElement('div');
        toast.className = 'cart-toast';
        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="color: #059669; font-size: 1.2rem;">✓</span>
                <span>${message}</span>
            </div>
        `;
        
        Object.assign(toast.style, {
            position: 'fixed',
            top: '100px',
            right: '20px',
            background: '#1e3a8a',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '25px',
            boxShadow: '0 4px 20px rgba(30, 58, 138, 0.3)',
            zIndex: '10000',
            transform: 'translateX(100%)',
            transition: 'all 0.3s ease',
            fontWeight: '500'
        });
        
        document.body.appendChild(toast);
        
        setTimeout(() => toast.style.transform = 'translateX(0)', 100);
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },
    
    // Open cart modal
    openModal: function() {
        console.log('Opening cart modal...');
        
        // Remove existing modal
        const existingModal = document.querySelector('.cart-overlay');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Create modal
        const overlay = document.createElement('div');
        overlay.className = 'cart-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        const modal = document.createElement('div');
        modal.className = 'cart-modal';
        modal.style.cssText = `
            background: white;
            width: 90%;
            max-width: 500px;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            max-height: 80vh;
            overflow-y: auto;
            transform: scale(0.9);
            transition: transform 0.3s ease;
        `;
        
        // Build modal content
        const cartData = this.getCart();
        const items = Object.keys(cartData);
        let total = 0;
        
        let itemsHTML = '';
        if (items.length === 0) {
            itemsHTML = '<p style="text-align: center; color: #666; padding: 2rem;">Your cart is empty.</p>';
        } else {
            items.forEach(id => {
                const item = cartData[id];
                const lineTotal = item.price * item.qty;
                total += lineTotal;
                
                itemsHTML += `
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 1rem 0; border-bottom: 1px solid #eee;">
                        <div style="flex: 1;">
                            <strong style="display: block; margin-bottom: 4px;">${item.name}</strong>
                            <div style="color: #666;">₹${item.price} each</div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <button onclick="window.cart.updateQty('${id}', -1)" style="background: #1e3a8a; color: white; border: none; width: 30px; height: 30px; border-radius: 4px; cursor: pointer;">-</button>
                            <div style="min-width: 30px; text-align: center; font-weight: bold;">${item.qty}</div>
                            <button onclick="window.cart.updateQty('${id}', 1)" style="background: #1e3a8a; color: white; border: none; width: 30px; height: 30px; border-radius: 4px; cursor: pointer;">+</button>
                            <div style="margin-left: 12px; font-weight: bold;">₹${lineTotal}</div>
                            <button onclick="window.cart.removeItem('${id}')" style="background: #dc2626; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; margin-left: 8px;">Remove</button>
                        </div>
                    </div>
                `;
            });
        }
        
        modal.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h4 style="margin: 0; color: #1e3a8a; font-size: 1.5rem;">Your Cart</h4>
                <button onclick="window.cart.closeModal()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #666; padding: 5px; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">&times;</button>
            </div>
            <div class="cart-items">
                ${itemsHTML}
            </div>
            <div style="font-weight: 700; margin: 16px 0; text-align: right; font-size: 1.2rem; color: #1e3a8a;">
                Total: ₹${total.toLocaleString('en-IN')}
            </div>
            <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px;">
                <button onclick="window.cart.closeModal()" style="background: #6b7280; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; transition: all 0.3s ease;">Close</button>
                <button onclick="window.cart.checkout()" style="background: #1e3a8a; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; transition: all 0.3s ease;">Checkout</button>
            </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // Show modal with animation
        setTimeout(() => {
            overlay.style.opacity = '1';
            modal.style.transform = 'scale(1)';
        }, 10);
        
        // Close on outside click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closeModal();
            }
        });
        
        // Close on ESC key
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
        
        console.log('Cart modal opened successfully');
    },
    
    // Close cart modal
    closeModal: function() {
        console.log('Closing cart modal...');
        const overlay = document.querySelector('.cart-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
            const modal = overlay.querySelector('.cart-modal');
            if (modal) {
                modal.style.transform = 'scale(0.9)';
            }
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            }, 300);
        }
    },
    
    // Update item quantity
    updateQty: function(id, delta) {
        const cartData = this.getCart();
        if (cartData[id]) {
            cartData[id].qty += delta;
            if (cartData[id].qty <= 0) {
                delete cartData[id];
            }
            this.saveCart(cartData);
            this.openModal(); // Refresh modal
        }
    },
    
    // Remove item from cart
    removeItem: function(id) {
        const cartData = this.getCart();
        if (cartData[id]) {
            delete cartData[id];
            this.saveCart(cartData);
            this.showToast('Item removed from cart');
            this.openModal(); // Refresh modal
        }
    },
    
    // Checkout function
    checkout: function() {
        alert('Checkout functionality would be implemented here. Cart items are saved in localStorage.');
    }
};

// Legacy function compatibility
window.addToCart = function(id, name, price, qty) {
    window.cart.addItem(id, name, price, qty);
};

window.getCart = function() {
    return window.cart.getCart();
};

window.saveCart = function(cartData) {
    window.cart.saveCart(cartData);
};

window.updateCartCountUI = function() {
    window.cart.updateCartCount();
};

window.openCartModal = function() {
    window.cart.openModal();
};

window.closeCartModal = function() {
    window.cart.closeModal();
};

// Initialize cart functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing cart functionality...');
    
    // Initialize cart count
    window.cart.updateCartCount();
    
    // Initialize cart button
    setTimeout(() => {
        const cartBtn = document.getElementById('cart-btn');
        if (cartBtn) {
            console.log('Cart button found, adding event listener...');
            
            // Remove any existing listeners
            cartBtn.replaceWith(cartBtn.cloneNode(true));
            const newCartBtn = document.getElementById('cart-btn');
            
            newCartBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Cart button clicked!');
                
                // Add visual feedback
                newCartBtn.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    newCartBtn.style.transform = '';
                }, 150);
                
                // Open cart modal
                window.cart.openModal();
            });
            
            console.log('✅ Cart button initialized successfully');
        } else {
            console.log('❌ Cart button not found');
        }
    }, 1000);
    
    console.log('✅ Cart functionality initialized');
});

function updateCartQty(id, delta) {
    const cart = getCart();
    if (!cart[id]) return;
    
    cart[id].qty += delta;
    if (cart[id].qty <= 0) {
        delete cart[id];
    }
    
    saveCart(cart);
}

function removeFromCart(id) {
    const cart = getCart();
    if (cart[id]) {
        delete cart[id];
        saveCart(cart);
        showCartToast('Item removed from cart');
    }
}

// Initialize all functionality
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        initializeProductButtons();
        initializeCartButtons();
    }, 1200);
});

// Enhanced add to cart function with better feedback
function addToCartEnhanced(id, name, price, qty = 1) {
    const cart = getCart();
    if (!cart[id]) {
        cart[id] = { id, name, price: Number(price), qty: 0 };
    }
    cart[id].qty += qty;
    saveCart(cart);
    
    // Show enhanced toast notification
    showEnhancedCartToast(`${name} added to cart!`);
    
    // Update cart count with animation
    updateCartCountWithAnimation();
}

function showEnhancedCartToast(text) {
    // Remove existing toast
    const existingToast = document.querySelector('.cart-toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Create new toast
    const toast = document.createElement('div');
    toast.className = 'cart-toast enhanced';
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">✓</span>
            <span class="toast-text">${text}</span>
        </div>
    `;
    
    // Add enhanced styling
    toast.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: #1e3a8a;
        color: white;
        padding: 12px 20px;
        border-radius: 25px;
        box-shadow: 0 4px 20px rgba(30, 58, 138, 0.3);
        z-index: 10000;
        transform: translateX(100%);
        transition: all 0.3s ease;
        font-weight: 500;
    `;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 100);
    
    // Animate out
    setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

function updateCartCountWithAnimation() {
    const countEl = document.getElementById('cart-count');
    if (countEl) {
        // Add bounce animation
        countEl.style.transform = 'scale(1.3)';
        countEl.style.background = '#1e3a8a';
        
        // Update count
        countEl.textContent = getCartCount();
        
        // Reset animation
        setTimeout(() => {
            countEl.style.transform = '';
            countEl.style.background = '';
        }, 300);
    }
}

// Initialize button hover effects
document.addEventListener('DOMContentLoaded', () => {
    // Add enhanced hover effects to all buttons
    document.querySelectorAll('.btn-primary, .perfume-add-btn, .cart-btn').forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            btn.style.boxShadow = '0 6px 20px rgba(30, 58, 138, 0.4)';
        });
        
        btn.addEventListener('mouseleave', () => {
            btn.style.boxShadow = '';
        });
    });
});

console.log('All buttons initialized and functional');
// Debug function to test add to cart functionality (manual use only)
window.testAddToCart = function() {
    console.log('Testing Add to Cart functionality...');
    
    const buttons = document.querySelectorAll('.perfume-add-btn');
    console.log(`Found ${buttons.length} Add to Cart buttons`);
    
    buttons.forEach((btn, index) => {
        console.log(`Button ${index + 1}:`, {
            id: btn.dataset.id,
            name: btn.dataset.name,
            price: btn.dataset.price,
            hasEventListener: btn.onclick !== null
        });
    });
    
    // Test cart functions
    console.log('Testing cart functions...');
    console.log('getCart:', typeof getCart);
    console.log('saveCart:', typeof saveCart);
    console.log('addToCart:', typeof addToCart);
    console.log('updateCartCountUI:', typeof updateCartCountUI);
    
    console.log('✅ Add to cart test functions available - use manually if needed');
};

// Auto-run initialization check (without adding test items)
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        console.log('🚀 Checking Add to Cart functionality...');
        
        const buttons = document.querySelectorAll('.perfume-add-btn');
        console.log(`Found ${buttons.length} Add to Cart buttons`);
        
        // Just check if functions exist, don't add test items
        console.log('Cart functions available:');
        console.log('- addToCart:', typeof addToCart);
        console.log('- getCart:', typeof getCart);
        console.log('- updateCartCountUI:', typeof updateCartCountUI);
        
        console.log('✅ Add to Cart functionality ready');
    }, 2000);
});

console.log('✅ Add to Cart functionality script loaded successfully');
// ===== CART FUNCTIONALITY TEST =====

// Test function for cart modal
window.testCartModal = function() {
    console.log('Testing cart modal functionality...');
    
    // Add a test item to cart
    addToCart('test-item', 'Test Product', 999, 1);
    
    // Open cart modal
    setTimeout(() => {
        openCartModal();
        
        // Test close button after modal opens
        setTimeout(() => {
            const closeButtons = document.querySelectorAll('.close-cart-btn');
            console.log(`Found ${closeButtons.length} close buttons`);
            
            closeButtons.forEach((btn, index) => {
                console.log(`Close button ${index + 1}:`, btn.textContent || 'X');
            });
            
            if (closeButtons.length > 0) {
                console.log('✅ Close buttons found and should be working');
            } else {
                console.log('❌ No close buttons found');
            }
        }, 500);
    }, 1000);
};

// Auto-test cart functionality
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        console.log('🛒 Testing cart modal functionality...');
        
        // Test if cart button exists
        const cartBtn = document.getElementById('cart-btn');
        if (cartBtn) {
            console.log('✅ Cart button found');
        } else {
            console.log('❌ Cart button not found');
        }
        
        // Test cart functions
        console.log('Cart functions available:');
        console.log('- openCartModal:', typeof openCartModal);
        console.log('- closeCartModal:', typeof closeCartModal);
        console.log('- buildCartModal:', typeof buildCartModal);
        
    }, 2500);
});

console.log('✅ Cart modal functionality with working close button loaded');
// ===== CART TEST FUNCTION =====

// Simple test function for cart (manual use only)
window.testCart = function() {
    console.log('🛒 Testing cart functionality...');
    
    // Test cart button
    const cartBtn = document.getElementById('cart-btn');
    console.log('Cart button found:', !!cartBtn);
    
    // Show current cart contents
    const currentCart = window.cart.getCart();
    console.log('Current cart contents:', currentCart);
    
    // Test opening modal (without adding items)
    setTimeout(() => {
        window.cart.openModal();
        console.log('Cart modal should be open now');
    }, 1000);
};

console.log('✅ Simplified cart system loaded successfully');
// ===== SLIDER DOTS VERIFICATION =====

// Verify slider dots match slide count
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        // Check product slider
        const productSlider = document.getElementById('product-slider');
        if (productSlider) {
            const slides = productSlider.querySelectorAll('.slide');
            const dots = productSlider.querySelectorAll('.dot');
            console.log(`Product slider: ${slides.length} slides, ${dots.length} dots`);
            
            if (slides.length !== dots.length) {
                console.warn('⚠️ Product slider: Slide count does not match dot count');
            } else {
                console.log('✅ Product slider: Slide and dot count match');
            }
        }
        
        // Check creams slider
        const creamsSlider = document.getElementById('creams-slider');
        if (creamsSlider) {
            const slides = creamsSlider.querySelectorAll('.slide');
            const dots = creamsSlider.querySelectorAll('.dot');
            console.log(`Creams slider: ${slides.length} slides, ${dots.length} dots`);
            
            if (slides.length !== dots.length) {
                console.warn('⚠️ Creams slider: Slide count does not match dot count');
            } else {
                console.log('✅ Creams slider: Slide and dot count match');
            }
        }
    }, 2000);
});

console.log('✅ Slider dots verification loaded');
// ===== CART CLEANUP =====

// Function to remove test items from cart
window.cleanupTestItems = function() {
    const cart = window.cart.getCart();
    let cleaned = false;
    
    // Remove any test items
    Object.keys(cart).forEach(id => {
        if (id.includes('test') || cart[id].name.includes('Test')) {
            delete cart[id];
            cleaned = true;
        }
    });
    
    if (cleaned) {
        window.cart.saveCart(cart);
        console.log('✅ Test items removed from cart');
        window.cart.showToast('Test items removed from cart');
    } else {
        console.log('No test items found in cart');
    }
};

// Auto-cleanup test items on page load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        // Clean up any test items that might be in the cart
        const cart = window.cart.getCart();
        const testItems = Object.keys(cart).filter(id => 
            id.includes('test') || cart[id].name.includes('Test')
        );
        
        if (testItems.length > 0) {
            console.log(`Found ${testItems.length} test items in cart, removing...`);
            testItems.forEach(id => delete cart[id]);
            window.cart.saveCart(cart);
            console.log('✅ Test items automatically cleaned up');
        }
    }, 500);
});

console.log('✅ Cart cleanup functionality loaded');
// ===== CART BUTTON VISIBILITY FIX =====

// Ensure cart button is visible and functional
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const cartBtn = document.getElementById('cart-btn');
        
        if (cartBtn) {
            console.log('✅ Cart button found');
            
            // Add working class to remove debug outline
            cartBtn.classList.add('working');
            
            // Ensure it's visible
            cartBtn.style.display = 'inline-flex';
            cartBtn.style.visibility = 'visible';
            cartBtn.style.opacity = '1';
            
            // Add fallback text if icon doesn't load
            const icon = cartBtn.querySelector('i');
            if (icon && !icon.textContent) {
                icon.textContent = '🛒';
                icon.style.fontFamily = 'Arial, sans-serif';
            }
            
            console.log('Cart button visibility ensured');
        } else {
            console.error('❌ Cart button not found - creating fallback');
            
            // Create fallback cart button
            const nav = document.querySelector('nav');
            if (nav) {
                const fallbackCartBtn = document.createElement('button');
                fallbackCartBtn.id = 'cart-btn';
                fallbackCartBtn.className = 'cart-btn';
                fallbackCartBtn.innerHTML = `
                    🛒
                    <span class="cart-count" id="cart-count">0</span>
                `;
                fallbackCartBtn.setAttribute('aria-label', 'View Cart');
                fallbackCartBtn.style.marginLeft = '10px';
                
                nav.appendChild(fallbackCartBtn);
                
                // Initialize the fallback button
                window.cart.updateCartCount();
                
                console.log('✅ Fallback cart button created');
            }
        }
        
        // Test cart button click
        const finalCartBtn = document.getElementById('cart-btn');
        if (finalCartBtn) {
            finalCartBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Cart button clicked!');
                window.cart.openModal();
            });
            
            console.log('✅ Cart button click handler added');
        }
        
    }, 1000);
});

// Function to manually show cart button (for debugging)
window.showCartButton = function() {
    const cartBtn = document.getElementById('cart-btn');
    if (cartBtn) {
        cartBtn.style.display = 'inline-flex !important';
        cartBtn.style.visibility = 'visible !important';
        cartBtn.style.opacity = '1 !important';
        cartBtn.style.position = 'relative !important';
        cartBtn.style.zIndex = '1001 !important';
        console.log('Cart button forced to be visible');
    } else {
        console.log('Cart button not found');
    }
};

console.log('✅ Cart button visibility fix loaded');
// ===== COLLECTION-LEVEL ADD TO CART BUTTONS =====

// Handle collection-level add to cart buttons (Buy Now -> Add to Cart conversion)
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        // Find collection-level add to cart buttons
        const collectionButtons = document.querySelectorAll('.product-actions .perfume-add-btn');
        
        console.log(`Found ${collectionButtons.length} collection-level add to cart buttons`);
        
        collectionButtons.forEach((btn, index) => {
            console.log(`Initializing collection button ${index + 1}:`, {
                id: btn.dataset.id,
                name: btn.dataset.name,
                price: btn.dataset.price
            });
            
            // Remove any existing event listeners
            btn.removeEventListener('click', handleCollectionAddToCart);
            
            // Add new event listener
            btn.addEventListener('click', handleCollectionAddToCart);
            
            // Add visual feedback on hover
            btn.addEventListener('mouseenter', () => {
                btn.style.transform = 'translateY(-1px)';
                btn.style.boxShadow = '0 6px 20px rgba(30, 58, 138, 0.4)';
            });
            
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = '';
                btn.style.boxShadow = '';
            });
        });
        
        console.log('✅ Collection-level add to cart buttons initialized');
    }, 1500);
});

function handleCollectionAddToCart(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const btn = event.target;
    const id = btn.dataset.id;
    const name = btn.dataset.name;
    const price = btn.dataset.price;
    
    console.log('Collection Add to Cart clicked:', { id, name, price });
    
    if (!id || !name || !price) {
        console.error('Missing collection product data:', { id, name, price });
        alert('Error: Product information is missing');
        return;
    }
    
    // Add visual feedback
    btn.style.transform = 'scale(0.95)';
    btn.style.background = '#1d4ed8';
    
    const originalText = btn.textContent;
    btn.textContent = 'Adding...';
    btn.disabled = true;
    
    // Add to cart
    try {
        window.cart.addItem(id, name, price, 1);
        
        // Success feedback
        btn.textContent = 'Added!';
        btn.style.background = '#059669'; // Green for success
        
        // Reset button after 2 seconds
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.transform = '';
            btn.style.background = '#1e3a8a';
            btn.disabled = false;
        }, 2000);
        
    } catch (error) {
        console.error('Error adding collection to cart:', error);
        
        // Error feedback
        btn.textContent = 'Error!';
        btn.style.background = '#dc2626'; // Red for error
        
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.transform = '';
            btn.style.background = '#1e3a8a';
            btn.disabled = false;
        }, 2000);
    }
}

console.log('✅ Collection-level add to cart functionality loaded');
// ===== OFFER BANNER VISIBILITY AND FUNCTIONALITY =====

// Force banner visibility and functionality
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 Initializing offer banner...');
    
    setTimeout(() => {
        const offerBanner = document.querySelector('.offer-banner');
        const offerContent = document.querySelector('.offer-content');
        
        if (offerBanner) {
            console.log('✅ Offer banner found');
            
            // Force visibility
            offerBanner.style.display = 'block';
            offerBanner.style.visibility = 'visible';
            offerBanner.style.opacity = '1';
            offerBanner.style.position = 'fixed';
            offerBanner.style.top = '0';
            offerBanner.style.left = '0';
            offerBanner.style.width = '100%';
            offerBanner.style.zIndex = '9999';
            offerBanner.style.background = '#1e3a8a';
            offerBanner.style.height = '45px';
            offerBanner.style.borderBottom = '4px solid #1d4ed8';
            
            // Add working class to remove debug border
            setTimeout(() => {
                offerBanner.classList.add('working');
            }, 3000);
            
            console.log('Offer banner forced to be visible');
        } else {
            console.error('❌ Offer banner not found - creating fallback');
            
            // Create fallback banner
            const fallbackBanner = document.createElement('div');
            fallbackBanner.className = 'offer-banner';
            fallbackBanner.innerHTML = `
                <div class="offer-scroll">
                    <div class="offer-content">
                        📞 Contact: +91 8778101432 | 💌 Email: sajjuhashim10@gmail.com | 🎉 TODAY'S SPECIAL: 25% OFF on All Fragrances | 💄 MEGA DEAL: Buy 2 Get 1 FREE on Skincare | 🌟 LIMITED TIME: 30% OFF Perfumed Creams | 📱 WhatsApp: +91 8778101432 for Instant Orders | 🚚 FREE Delivery on Orders Above ₹999 | 💝 FLASH SALE: Up to 40% OFF Today Only
                    </div>
                </div>
            `;
            
            // Insert at the beginning of body
            document.body.insertBefore(fallbackBanner, document.body.firstChild);
            
            console.log('✅ Fallback offer banner created');
        }
        
        // Make contact information clickable
        const finalOfferContent = document.querySelector('.offer-content');
        if (finalOfferContent) {
            let content = finalOfferContent.innerHTML;
            
            // Replace phone numbers with clickable links
            content = content.replace(/(\+91 8778101432)/g, '<a href="tel:+918778101432" style="color: white; text-decoration: none; font-weight: 600;">$1</a>');
            
            // Replace email with clickable link
            content = content.replace(/(sajjuhashim10@gmail\.com)/g, '<a href="mailto:sajjuhashim10@gmail.com" style="color: white; text-decoration: none; font-weight: 600;">$1</a>');
            
            // Replace WhatsApp with clickable link
            content = content.replace(/(WhatsApp: \+91 8778101432)/g, '<a href="https://wa.me/918778101432" target="_blank" style="color: white; text-decoration: none; font-weight: 600;">$1</a>');
            
            finalOfferContent.innerHTML = content;
            
            console.log('✅ Offer banner contact links activated');
        }
        
        // Adjust navbar position
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            navbar.style.top = '45px';
            navbar.style.marginTop = '0';
            console.log('✅ Navbar position adjusted');
        }
        
        // Adjust main content padding
        const hero = document.querySelector('.hero');
        if (hero) {
            hero.style.paddingTop = '165px';
            console.log('✅ Hero padding adjusted');
        }
        
        // Adjust container padding for fragrance page
        const containers = document.querySelectorAll('.container[style*="padding"]');
        containers.forEach(container => {
            if (container.style.padding.includes('140px')) {
                container.style.paddingTop = '185px';
                console.log('✅ Container padding adjusted');
            }
        });
        
    }, 500);
});

// Function to manually show banner (for debugging)
window.showOfferBanner = function() {
    const banner = document.querySelector('.offer-banner');
    if (banner) {
        banner.style.display = 'block !important';
        banner.style.visibility = 'visible !important';
        banner.style.opacity = '1 !important';
        banner.style.position = 'fixed !important';
        banner.style.top = '0 !important';
        banner.style.zIndex = '9999 !important';
        console.log('✅ Offer banner forced to show');
    } else {
        console.log('❌ Offer banner not found');
    }
};

// Function to test banner animation
window.testBannerAnimation = function() {
    const content = document.querySelector('.offer-content');
    if (content) {
        content.style.animation = 'scrollText 10s linear infinite';
        console.log('✅ Banner animation set to 10 seconds for testing');
    }
};

console.log('✅ Enhanced offer banner functionality loaded');