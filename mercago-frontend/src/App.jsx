import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_BASE_URL = 'http://127.0.0.1:8000'
const TOKEN_KEY = 'sanctum_token'

const emptyProductForm = {
  product_name: '',
  category: '',
  price: '',
  unit: '',
  stock_qty: '',
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '')
  const [activeAuthTab, setActiveAuthTab] = useState('login')
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const [productError, setProductError] = useState('')
  const [productsLoading, setProductsLoading] = useState(false)
  const [products, setProducts] = useState([])
  const [isSavingProduct, setIsSavingProduct] = useState(false)
  const [editingProductId, setEditingProductId] = useState(null)

  const [registerForm, setRegisterForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'vendor',
  })

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  })

  const [productForm, setProductForm] = useState(emptyProductForm)

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    }),
    [token]
  )

  const extractErrorMessage = async (response) => {
    try {
      const data = await response.json()
      if (typeof data?.message === 'string') return data.message
      if (data?.errors && typeof data.errors === 'object') {
        const firstError = Object.values(data.errors)[0]
        if (Array.isArray(firstError) && firstError.length > 0) return firstError[0]
      }
    } catch {
      // Fall through to generic message.
    }
    return 'Something went wrong. Please try again.'
  }

  const saveTokenAndEnterDashboard = (newToken) => {
    localStorage.setItem(TOKEN_KEY, newToken)
    setToken(newToken)
    setAuthError('')
  }

  const handleRegister = async (event) => {
    event.preventDefault()
    setAuthLoading(true)
    setAuthError('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/register`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerForm),
      })

      if (!response.ok) {
        setAuthError(await extractErrorMessage(response))
        return
      }

      const data = await response.json()
      const receivedToken = data?.token || data?.access_token
      if (!receivedToken) {
        setAuthError('Registration succeeded but token was not returned.')
        return
      }

      saveTokenAndEnterDashboard(receivedToken)
    } catch {
      setAuthError('Unable to reach API server.')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogin = async (event) => {
    event.preventDefault()
    setAuthLoading(true)
    setAuthError('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginForm),
      })

      if (!response.ok) {
        setAuthError(await extractErrorMessage(response))
        return
      }

      const data = await response.json()
      const receivedToken = data?.token || data?.access_token
      if (!receivedToken) {
        setAuthError('Login succeeded but token was not returned.')
        return
      }

      saveTokenAndEnterDashboard(receivedToken)
    } catch {
      setAuthError('Unable to reach API server.')
    } finally {
      setAuthLoading(false)
    }
  }

  const fetchProducts = async () => {
    if (!token) return

    setProductsLoading(true)
    setProductError('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/products`, {
        method: 'GET',
        headers: authHeaders,
      })

      if (!response.ok) {
        setProductError(await extractErrorMessage(response))
        if (response.status === 401) handleLogout()
        return
      }

      const data = await response.json()
      if (Array.isArray(data)) {
        setProducts(data)
      } else if (Array.isArray(data?.data)) {
        setProducts(data.data)
      } else {
        setProducts([])
      }
    } catch {
      setProductError('Unable to load products from API.')
    } finally {
      setProductsLoading(false)
    }
  }

  useEffect(() => {
    if (token) fetchProducts()
  }, [token])

  const handleSaveProduct = async (event) => {
    event.preventDefault()
    setIsSavingProduct(true)
    setProductError('')

    const payload = {
      ...productForm,
      price: Number(productForm.price),
      stock_qty: Number(productForm.stock_qty),
    }

    const isEdit = Boolean(editingProductId)
    const url = isEdit
      ? `${API_BASE_URL}/api/products/${editingProductId}`
      : `${API_BASE_URL}/api/products`

    try {
      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: authHeaders,
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        setProductError(await extractErrorMessage(response))
        return
      }

      setProductForm(emptyProductForm)
      setEditingProductId(null)
      await fetchProducts()
    } catch {
      setProductError('Unable to save product.')
    } finally {
      setIsSavingProduct(false)
    }
  }

  const startEditProduct = (product) => {
    setEditingProductId(product.id)
    setProductForm({
      product_name: product.product_name ?? '',
      category: product.category ?? '',
      price: String(product.price ?? ''),
      unit: product.unit ?? '',
      stock_qty: String(product.stock_qty ?? ''),
    })
    setProductError('')
  }

  const cancelEdit = () => {
    setEditingProductId(null)
    setProductForm(emptyProductForm)
  }

  const handleDeleteProduct = async (productId) => {
    setProductError('')
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
        method: 'DELETE',
        headers: authHeaders,
      })

      if (!response.ok) {
        setProductError(await extractErrorMessage(response))
        return
      }

      setProducts((prevProducts) => prevProducts.filter((item) => item.id !== productId))
      if (editingProductId === productId) cancelEdit()
    } catch {
      setProductError('Unable to delete product.')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY)
    setToken('')
    setProducts([])
    setEditingProductId(null)
    setProductForm(emptyProductForm)
  }

  return (
    <main className="app-shell">
      <div className="card">
        <h1>Mercago Sanctum API Tester</h1>
        <p className="subtitle">Base URL: {API_BASE_URL}</p>

        {!token ? (
          <section>
            <div className="tabs">
              <button
                className={activeAuthTab === 'login' ? 'tab active' : 'tab'}
                type="button"
                onClick={() => setActiveAuthTab('login')}
              >
                Login
              </button>
              <button
                className={activeAuthTab === 'register' ? 'tab active' : 'tab'}
                type="button"
                onClick={() => setActiveAuthTab('register')}
              >
                Register
              </button>
            </div>

            {authError ? <p className="error">{authError}</p> : null}

            {activeAuthTab === 'login' ? (
              <form className="form-grid" onSubmit={handleLogin}>
                <label>
                  Email
                  <input
                    type="email"
                    value={loginForm.email}
                    onChange={(event) =>
                      setLoginForm((prev) => ({ ...prev, email: event.target.value }))
                    }
                    required
                  />
                </label>
                <label>
                  Password
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(event) =>
                      setLoginForm((prev) => ({ ...prev, password: event.target.value }))
                    }
                    required
                  />
                </label>
                <button type="submit" disabled={authLoading}>
                  {authLoading ? 'Logging in...' : 'Login'}
                </button>
              </form>
            ) : (
              <form className="form-grid" onSubmit={handleRegister}>
                <label>
                  First Name
                  <input
                    type="text"
                    value={registerForm.first_name}
                    onChange={(event) =>
                      setRegisterForm((prev) => ({
                        ...prev,
                        first_name: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label>
                  Last Name
                  <input
                    type="text"
                    value={registerForm.last_name}
                    onChange={(event) =>
                      setRegisterForm((prev) => ({
                        ...prev,
                        last_name: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label>
                  Email
                  <input
                    type="email"
                    value={registerForm.email}
                    onChange={(event) =>
                      setRegisterForm((prev) => ({ ...prev, email: event.target.value }))
                    }
                    required
                  />
                </label>
                <label>
                  Password
                  <input
                    type="password"
                    value={registerForm.password}
                    onChange={(event) =>
                      setRegisterForm((prev) => ({
                        ...prev,
                        password: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label>
                  Role
                  <select
                    value={registerForm.role}
                    onChange={(event) =>
                      setRegisterForm((prev) => ({ ...prev, role: event.target.value }))
                    }
                    required
                  >
                    <option value="shopper">shopper</option>
                    <option value="vendor">vendor</option>
                    <option value="rider">rider</option>
                  </select>
                </label>
                <button type="submit" disabled={authLoading}>
                  {authLoading ? 'Registering...' : 'Register'}
                </button>
              </form>
            )}
          </section>
        ) : (
          <section>
            <div className="dashboard-head">
              <h2>Vendor Dashboard</h2>
              <button type="button" className="secondary-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>

            {productError ? <p className="error">{productError}</p> : null}

            <form className="form-grid" onSubmit={handleSaveProduct}>
              <h3>{editingProductId ? 'Edit Product' : 'Create Product'}</h3>
              <label>
                Product Name
                <input
                  type="text"
                  value={productForm.product_name}
                  onChange={(event) =>
                    setProductForm((prev) => ({
                      ...prev,
                      product_name: event.target.value,
                    }))
                  }
                  required
                />
              </label>
              <label>
                Category
                <input
                  type="text"
                  value={productForm.category}
                  onChange={(event) =>
                    setProductForm((prev) => ({ ...prev, category: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                Price
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={productForm.price}
                  onChange={(event) =>
                    setProductForm((prev) => ({ ...prev, price: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                Unit
                <input
                  type="text"
                  value={productForm.unit}
                  onChange={(event) =>
                    setProductForm((prev) => ({ ...prev, unit: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                Stock Quantity
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={productForm.stock_qty}
                  onChange={(event) =>
                    setProductForm((prev) => ({ ...prev, stock_qty: event.target.value }))
                  }
                  required
                />
              </label>
              <div className="actions">
                <button type="submit" disabled={isSavingProduct}>
                  {isSavingProduct
                    ? 'Saving...'
                    : editingProductId
                    ? 'Update Product'
                    : 'Create Product'}
                </button>
                {editingProductId ? (
                  <button type="button" className="secondary-btn" onClick={cancelEdit}>
                    Cancel Edit
                  </button>
                ) : null}
              </div>
            </form>

            <div className="list-head">
              <h3>Your Products</h3>
              <button type="button" className="secondary-btn" onClick={fetchProducts}>
                Refresh
              </button>
            </div>

            {productsLoading ? <p>Loading products...</p> : null}

            {!productsLoading && products.length === 0 ? (
              <p className="empty-note">No products found.</p>
            ) : null}

            {!productsLoading && products.length > 0 ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Unit</th>
                      <th>Stock</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td>{product.product_name}</td>
                        <td>{product.category}</td>
                        <td>{product.price}</td>
                        <td>{product.unit}</td>
                        <td>{product.stock_qty}</td>
                        <td className="row-actions">
                          <button type="button" onClick={() => startEditProduct(product)}>
                            Edit
                          </button>
                          <button
                            type="button"
                            className="danger-btn"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </section>
        )}
      </div>
    </main>
  )
}

export default App
