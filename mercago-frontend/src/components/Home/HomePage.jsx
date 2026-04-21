import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../../config'

// ── Product Card Component with Granular Pricing ──
function ProductCard({ product, handleAddToCart, addedProductId, vendorName }) {
  const [variation, setVariation] = useState('1')
  const [customQty, setCustomQty] = useState('1')

  // Normalize unit
  const baseUnit = (product.unit || 'pcs').toLowerCase().trim()

  let options = []
  if (baseUnit === 'kg' || baseUnit === 'kilo' || baseUnit === 'kilogram') {
    options = [
      { label: '250g', multiplier: 0.25 },
      { label: '500g', multiplier: 0.5 },
      { label: '1kg', multiplier: 1 },
      { label: '2kg', multiplier: 2 },
      { label: '3kg', multiplier: 3 },
      { label: '5kg', multiplier: 5 }
    ]
  } else if (baseUnit === 'g' || baseUnit === 'gram') {
    options = [
      { label: '100g', multiplier: 1 },
      { label: '250g', multiplier: 2.5 },
      { label: '500g', multiplier: 5 },
      { label: '1kg', multiplier: 10 }
    ]
  } else {
    options = [
      { label: `1 ${product.unit}`, multiplier: 1 },
      { label: `2 ${product.unit}s`, multiplier: 2 },
      { label: `3 ${product.unit}s`, multiplier: 3 },
      { label: `5 ${product.unit}s`, multiplier: 5 },
      { label: `10 ${product.unit}s`, multiplier: 10 }
    ]
  }
  
  // Add Custom Option to the end
  options.push({ label: 'Custom Amount...', multiplier: 'custom' })

  // Pre-select the "1 unit" multiplier default based on base settings
  useEffect(() => {
    const defaultOpt = options.find(o => o.multiplier === 1) || options[0]
    setVariation(String(defaultOpt.multiplier))
  }, [baseUnit])

  const isCustom = variation === 'custom'
  const activeMultiplier = isCustom ? (Number(customQty) || 0) : (options.find(o => String(o.multiplier) === variation)?.multiplier || 1)
  const displayPrice = (Number(product.price) * activeMultiplier).toFixed(2)

  return (
    <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s, box-shadow 0.2s', border: '1px solid #f3f4f6' }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)' }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)' }}>
      {product.image_url ? (
        <div style={{ padding: '12px', paddingBottom: '0' }}>
          <img src={product.image_url} alt={product.product_name} style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block', borderRadius: '8px' }} />
        </div>
      ) : (
        <div style={{ height: '160px', margin: '12px', marginBottom: '0', borderRadius: '8px', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', color: '#d1d5db' }}>🛒</div>
      )}
      <div style={{ padding: '16px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#111', marginBottom: '4px' }}>{product.product_name}</div>
        <div style={{ color: '#6b7280', fontSize: '0.8rem', marginBottom: 'auto' }}>🏪 {vendorName || product.vendorName}</div>

        {/* Granular Unit Dropdown */}
        <div style={{ marginTop: '12px', marginBottom: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            value={variation}
            onChange={e => setVariation(e.target.value)}
            style={{ flex: 1, padding: '6px 8px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '0.82rem', fontWeight: 500, color: '#1f2937', background: '#f8fafc', outline: 'none', cursor: 'pointer', appearance: 'menulist' }}
          >
            {options.map(o => (
              <option key={o.label} value={o.multiplier}>{o.label}</option>
            ))}
          </select>
          {isCustom && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '0 6px' }}>
              <input 
                type="number" 
                min="0.01" 
                step="any"
                value={customQty} 
                onChange={(e) => setCustomQty(e.target.value)} 
                style={{ width: '40px', border: 'none', background: 'transparent', fontSize: '0.82rem', fontWeight: 500, outline: 'none', textAlign: 'center', padding: '6px 0' }}
              />
              <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600 }}>{product.unit}</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 700, color: '#1e3a8a', fontSize: '1.05rem', lineHeight: 1 }}>₱{displayPrice}</span>
            {activeMultiplier !== 1 && <span style={{ fontSize: '0.65rem', color: '#6b7280', marginTop: '2px' }}>₱{Number(product.price).toFixed(2)} / {product.unit}</span>}
          </div>
          <button
            onClick={() => handleAddToCart(product, vendorName || product.vendorName, activeMultiplier)}
            disabled={activeMultiplier <= 0}
            style={{ background: addedProductId === product.id ? '#059669' : '#e0f2fe', color: addedProductId === product.id ? '#fff' : '#0284c7', opacity: activeMultiplier <= 0 ? 0.5 : 1, border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: activeMultiplier <= 0 ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.8rem', transition: 'all 0.2s' }}>
            {addedProductId === product.id ? '✓ Added' : '+ Add'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── All Listings Sub-Component ──
function AllListingsSection({ allProducts, loading, handleAddToCart, addedProductId, CATEGORIES }) {
  const [activeCat, setActiveCat] = useState('All')

  const displayed = activeCat === 'All'
    ? allProducts
    : allProducts.filter((p) => (p.category ?? '').toLowerCase() === activeCat.toLowerCase())

  return (
    <div>
      <h2 style={{ margin: '0 0 16px', fontWeight: 600, fontSize: '1.2rem', color: '#111', textTransform: 'uppercase' }}>ALL LISTINGS</h2>
      {/* Category filter chips */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {['All', ...CATEGORIES].map((cat) => (
          <button key={cat}
            onClick={() => setActiveCat(cat)}
            style={{
              background: activeCat === cat ? '#2563eb' : '#fff',
              color: activeCat === cat ? '#fff' : '#374151',
              border: activeCat === cat ? '1px solid #2563eb' : '1px solid #e5e7eb',
              borderRadius: '20px',
              padding: '6px 16px',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '0.85rem',
              transition: 'all 0.15s'
            }}>
            {cat}
          </button>
        ))}
      </div>
      {loading ? <p>Loading market...</p> : null}
      {!loading && displayed.length === 0 && (
        <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>No products in this category yet.</p>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
        {displayed.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            handleAddToCart={handleAddToCart}
            addedProductId={addedProductId}
          />
        ))}
      </div>
    </div>
  )
}

export default function HomePage({ onLoginClick, onSignUpClick, currentUser, onGoToDashboard }) {
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  const CATEGORIES = ['Fish', 'Crab', 'Shrimp', 'Pork', 'Chicken', 'Beef', 'Vegetables', 'Fruits']

  const CATEGORY_IMAGES = {
    Fish: '/cat-fish.png',
    Crab: '/cat-crab.png',
    Shrimp: '/cat-shrimp.png',
    Pork: '/cat-pork.png',
    Chicken: '/cat-chicken.png',
    Beef: '/cat-beef.png',
    Vegetables: '/cat-veggie.png',
    Fruits: '/cat-fruits.png',
  }

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/public/shop`)
      .then((r) => r.json())
      .then((d) => setVendors(Array.isArray(d) ? d : []))
      .catch(() => setVendors([]))
      .finally(() => setLoading(false))
  }, [])

  // Flatten all products for search & category filter
  const allProducts = vendors.flatMap((v) =>
    v.products.map((p) => ({ ...p, vendorName: v.vendor_name }))
  )

  const filteredProducts = allProducts.filter((p) => {
    const matchesSearch = p.product_name.toLowerCase().includes(search.toLowerCase()) ||
      (p.category ?? '').toLowerCase().includes(search.toLowerCase())
    const matchesCat = selectedCategory
      ? (p.category ?? '').toLowerCase() === selectedCategory.toLowerCase()
      : true
    return matchesSearch && matchesCat
  })

  const [addedProductId, setAddedProductId] = useState(null)

  // Live cart count from localStorage
  const getCartCount = () => {
    try {
      const cart = JSON.parse(localStorage.getItem('mercago_cart') || '[]')
      return cart.length // Distinct items is cleaner than decimal quantities
    } catch { return 0 }
  }
  const [cartCount, setCartCount] = useState(getCartCount)

  const handleAddToCart = (product, vendorName, quantityToAdd = 1) => {
    if (!currentUser || currentUser.role !== 'shopper') {
      setShowLoginPrompt(true)
      return
    }
    // Add to localStorage cart so ShopperDashboard picks it up
    const cart = (() => { try { return JSON.parse(localStorage.getItem('mercago_cart') || '[]') } catch { return [] } })()
    const existing = cart.find((i) => i.product.id === product.id)
    let updatedCart
    if (existing) {
      updatedCart = cart.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + quantityToAdd } : i)
    } else {
      updatedCart = [...cart, { product: { ...product, vendorName }, quantity: quantityToAdd }]
    }
    localStorage.setItem('mercago_cart', JSON.stringify(updatedCart))
    setCartCount(updatedCart.length)
    setAddedProductId(product.id)
    setTimeout(() => setAddedProductId(null), 1500)
  }

  // Header cart icon — just navigates to the cart tab
  const handleOpenCart = () => {
    if (!currentUser || currentUser.role !== 'shopper') {
      setShowLoginPrompt(true)
      return
    }
    localStorage.setItem('mercago_open_cart', 'true')
    onGoToDashboard()
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── Header Area ── */}
      <header style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '16px 48px' }}>

        {/* Top utility row */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '8px' }}>
          <button style={{ background: '#3b82f6', color: '#fff', fontSize: '0.75rem', fontWeight: 600, padding: '4px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>SELL ON MERCAGO</button>
          {!currentUser && (
            <>
              <button onClick={onLoginClick} style={{ background: '#fff', color: '#3b82f6', border: '1px solid #3b82f6', fontSize: '0.75rem', fontWeight: 600, padding: '4px 16px', borderRadius: '4px', cursor: 'pointer' }}>LOGIN</button>
              <button onClick={onSignUpClick} style={{ background: '#60a5fa', color: '#fff', fontSize: '0.75rem', fontWeight: 600, padding: '4px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>SIGN UP</button>
            </>
          )}
        </div>

        {/* Main Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem' }}>

          {/* Logo */}
          <div style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => setSelectedCategory(null)}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: '#2563eb', letterSpacing: '-0.5px' }}>
              MercaGO
            </span>
          </div>

          {/* Search Bar - Centered */}
          <div style={{ flex: 1, maxWidth: '500px', display: 'flex', gap: '0' }}>
            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Search fresh products..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setSelectedCategory(null) }}
                style={{ width: '100%', border: '1px solid #e5e7eb', borderRight: 'none', borderTopLeftRadius: '4px', borderBottomLeftRadius: '4px', outline: 'none', padding: '10px 32px 10px 16px', fontSize: '0.9rem', background: '#f3f6f9' }}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '1.2rem', padding: 0 }}>✕</button>
              )}
            </div>
            <button style={{ background: '#3b82f6', border: 'none', borderTopRightRadius: '4px', borderBottomRightRadius: '4px', width: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              <svg style={{ width: '18px', fill: 'none', stroke: '#fff', strokeWidth: 2 }} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </button>
          </div>

          {/* Cart & User */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexShrink: 0 }}>
            <button onClick={handleOpenCart} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0, position: 'relative' }}>
              <svg style={{ width: '30px', fill: 'none', stroke: '#374151', strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' }} viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
              {cartCount > 0 && (
                <span style={{ position: 'absolute', top: '-8px', right: '-25px', background: '#ef4444', color: '#fff', fontSize: '0.65rem', fontWeight: 700, minWidth: '18px', height: '18px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', boxShadow: '0 2px 4px rgba(239,68,68,0.4)', lineHeight: 1 }}>
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>

            {currentUser ? (
              <div onClick={onGoToDashboard} style={{ background: '#f1f5f9', borderRadius: '4px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#1e3a8a', fontSize: '0.75rem' }}>
                  {currentUser.first_name?.[0]?.toUpperCase()}
                </div>
                <div style={{ color: '#374151', fontWeight: 500, fontSize: '0.85rem' }}>{currentUser.first_name}</div>
              </div>
            ) : (
              <div style={{ background: '#f1f5f9', borderRadius: '4px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={onLoginClick}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '0.8rem' }}>
                  👤
                </div>
                <div style={{ color: '#475569', fontWeight: 500, fontSize: '0.85rem' }}>Guest</div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Login Prompt Modal ── */}
      {showLoginPrompt && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '2rem', maxWidth: 420, width: '90%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🛒</div>
            <h2 style={{ margin: '0 0 0.5rem', color: '#1e3a8a' }}>Account Required</h2>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              You need a <strong>Shopper account</strong> to add items to cart and place orders. Browse is free — ordering requires an account!
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => { setShowLoginPrompt(false); onLoginClick() }} style={{ background: '#2563eb', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>
                Login
              </button>
              <button onClick={() => { setShowLoginPrompt(false); onSignUpClick() }} style={{ background: '#fbbf24', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontWeight: 700, color: '#1e3a8a', fontSize: '0.95rem' }}>
                Sign Up
              </button>
              <button onClick={() => setShowLoginPrompt(false)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 600, color: '#374151' }}>
                Keep Browsing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Body ── */}
      <main style={{ maxWidth: 1000, margin: '2rem auto', padding: '0 1.5rem' }}>

        {/* ── Main Grid: Shows categories or search results ── */}
        {!search && !selectedCategory ? (
          <>
            {/* Category Grid */}
            <div style={{ marginBottom: '4rem' }}>
              <h2 style={{ margin: '0 0 20px', fontWeight: 600, fontSize: '1.2rem', color: '#111', textTransform: 'uppercase', letterSpacing: '0.5px' }}>CATEGORIES</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
                {CATEGORIES.slice(0, 6).map((cat) => (
                  <div key={cat} onClick={() => setSelectedCategory(cat)}
                    style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', transition: 'transform 0.2s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
                  >
                    <img
                      src={CATEGORY_IMAGES[cat]}
                      alt={cat}
                      style={{ width: '100%', height: '220px', objectFit: 'cover', display: 'block' }}
                      onError={(e) => { e.target.style.display = 'none' }}
                    />
                    <div style={{ padding: '16px', textAlign: 'center', fontWeight: 700, fontSize: '1.1rem', textTransform: 'uppercase', color: '#111' }}>{cat}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── All Listings ── */}
            <AllListingsSection
              allProducts={allProducts}
              loading={loading}
              handleAddToCart={handleAddToCart}
              addedProductId={addedProductId}
              CATEGORIES={CATEGORIES}
            />
          </>
        ) : (
          // Products filtered by search or category
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0, color: '#111', fontSize: '1.1rem', fontWeight: 700 }}>
                {selectedCategory ? `🐟 ${selectedCategory.toUpperCase()}` : `🔍 Results for "${search}"`}
              </h2>
              <button onClick={() => { setSelectedCategory(null); setSearch('') }} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>← Back</button>
            </div>

            {loading ? <p>Loading...</p> : null}
            {!loading && filteredProducts.length === 0 && (
              <p style={{ color: '#6b7280', textAlign: 'center', marginTop: '3rem', fontSize: '1.1rem' }}>No products found in this category yet. Check back soon!</p>
            )}

            {/* Grouped by Vendor */}
            {vendors
              .map((vendor) => {
                const vendorFiltered = vendor.products.filter((p) => {
                  const matchesSearch = p.product_name.toLowerCase().includes(search.toLowerCase()) ||
                    (p.category ?? '').toLowerCase().includes(search.toLowerCase())
                  const matchesCat = selectedCategory ? (p.category ?? '').toLowerCase() === selectedCategory.toLowerCase() : true
                  return matchesSearch && matchesCat
                })
                if (vendorFiltered.length === 0) return null
                return (
                  <div key={vendor.vendor_id} style={{ marginBottom: '2.5rem' }}>
                    <h3 style={{ borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#374151', fontSize: '1rem' }}>
                      🏪 {vendor.vendor_name}
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                      {vendorFiltered.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          vendorName={vendor.vendor_name}
                          handleAddToCart={handleAddToCart}
                          addedProductId={addedProductId}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
          </>
        )}
      </main>

      {/* ── Footer ── */}
      <footer style={{ background: '#1e293b', color: '#e2e8f0', padding: '3rem 2rem', marginTop: '4rem' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem' }}>
          <div>
            <h4 style={{ color: '#fff', fontSize: '1rem', marginBottom: '1rem', fontWeight: 600 }}>Quick links</h4>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
              {CATEGORIES.map(cat => (
                <span key={cat} style={{ cursor: 'pointer' }} onClick={() => { setSelectedCategory(cat); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>{cat}</span>
              ))}
            </div>
          </div>
          <div>
            <h4 style={{ color: '#fff', fontSize: '1rem', marginBottom: '1rem', fontWeight: 600 }}>Social Media</h4>
            <div style={{ display: 'flex', gap: '12px' }}>
              {['f', 't', 'i', 'y', 'in'].map((social, i) => (
                <div key={i} style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e293b', fontWeight: 'bold' }}>
                  {social}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ maxWidth: 1000, margin: '2rem auto 0', borderTop: '1px solid #334155', paddingTop: '1.5rem', textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8' }}>
          © 2026 MercaGO Marketplace. Fresh market delivered to your door.
        </div>
      </footer>
    </div>
  )
}
