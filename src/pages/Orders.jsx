import React, { useState, useMemo, useEffect } from 'react'
import { Header, FilterCard, Table, TextInput, Combobox, Modal, Button, Card } from 'storybook-dojo-react'
import { context as otelContext, trace as otelTrace, propagation as otelPropagation } from '@opentelemetry/api'
import { trace as otelTracer } from '../otel/initOtel'
import clientImg from '../images/client.png'

export default function Orders() {
  const user = (() => {
    try {
      return JSON.parse(sessionStorage.getItem('user'))?.user || 'Usuario'
    } catch (e) {
      return 'Usuario'
    }
  })()

  const links = [
    { key: 'home', label: 'Inicio', href: '/' },
    { key: 'dashboard', label: 'Dashboard', href: '/dashboard' }
  ]

  const tableColumns = [
    { key: 'orderId', label: 'Order ID', sortable: true },
    { key: 'customer', label: 'Cliente' },
    { key: 'status', label: 'Estado' },
    { key: 'orderDate', label: 'Fecha Orden' },
    { key: 'actions', label: 'Ver detalle' }
  ]

  const fallbackOrders = [
    {
      id: 1,
      customerId: 1,
      createAt: '2025-11-15',
      statusOrder: 'Pendiente',
      details: [
        { id: 1, productName: 'Cuaderno', quantity: 2, priceUnit: 4.5 },
        { id: 2, productName: 'Lapicero', quantity: 1, priceUnit: 2.1 }
      ]
    },
    {
      id: 2,
      customerId: 2,
      createAt: '2025-11-15',
      statusOrder: 'Pendiente',
      details: [
        { id: 3, productName: 'Libro', quantity: 3, priceUnit: 89.5 }
      ]
    },
    {
      id: 3,
      customerId: 3,
      createAt: '2025-11-15',
      statusOrder: 'Pendiente',
      details: [
        { id: 4, productName: 'Galletas Chomp', quantity: 6, priceUnit: 0.5 },
        { id: 5, productName: 'Barra Chocolate Winter', quantity: 1, priceUnit: 3.9 },
        { id: 6, productName: 'Chizito', quantity: 2, priceUnit: 1.0 }
      ]
    },
    {
      id: 4,
      customerId: 5,
      createAt: '2025-11-15',
      statusOrder: 'Pendiente',
      details: [
        { id: 7, productName: 'Folder Manila', quantity: 2, priceUnit: 0.5 },
        { id: 8, productName: 'Hojas Bond A4', quantity: 100, priceUnit: 0.1 }
      ]
    },
    {
      id: 5,
      customerId: 6,
      createAt: '2025-11-15',
      statusOrder: 'Pendiente',
      details: [
        { id: 9, productName: 'Caja de Bombones', quantity: 1, priceUnit: 12.5 }
      ]
    }
  ]

  const fallbackCustomers = [
    { id: 1, name: 'Junior', lastName: 'Quinones Ramirez', cellPhone: '968603237' },
    { id: 2, name: 'Miguel Angel', lastName: 'Hilario Ramirez', cellPhone: '997651687' },
    { id: 3, name: 'Diego', lastName: 'Bueno Pastor', cellPhone: '942759854' },
    { id: 4, name: 'Juan Carlos', lastName: 'Hilario Ramirez', cellPhone: '910838645' },
    { id: 5, name: 'Flor', lastName: 'Hilario Ramirez', cellPhone: '981292620' },
    { id: 6, name: 'Christian', lastName: 'Ramirez Davila', cellPhone: '982387744' }
  ]

  const [ordersRaw, setOrdersRaw] = useState([])
  const [customers, setCustomers] = useState(fallbackCustomers)
  const [customersFromEndpoint, setCustomersFromEndpoint] = useState(false)
  const [ordersFromEndpoint, setOrdersFromEndpoint] = useState(false)
  const [tableData, setTableData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [filterCustomer, setFilterCustomer] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const statusOptions = [
    { value: '', label: 'Todos' },
    { value: 'Pendiente', label: 'Pendiente' },
    { value: 'Enviado', label: 'Enviado' },
    { value: 'Cancelado', label: 'Cancelado' }
  ]

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalCustomer, setModalCustomer] = useState('')
  const [modalStatus, setModalStatus] = useState('')
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [detailOrder, setDetailOrder] = useState(null)

  const openNewModal = () => {
    setModalCustomer('')
    setModalStatus('')
    setIsModalOpen(true)
  }

  const handleCreate = () => {
    const nextId = tableData.length ? Math.max(...tableData.map(d => d.orderId)) + 1 : 1001
    setTableData([...tableData, { orderId: nextId, customer: modalCustomer || 'Sin nombre', status: modalStatus || 'Pending', orderDate: new Date().toISOString().slice(0,10), actions: null }])
    setIsModalOpen(false)
  }

  const openDetail = (order) => {
    setDetailOrder(order)
    setDetailModalOpen(true)
  }

  const mapOrdersToRows = (orders, customersList, onOpenDetail) => {
    return orders.map(o => {
      const total = (o.details || []).reduce((s, it) => s + (it.quantity || 0) * (it.priceUnit || 0), 0)
      const cust = (customersList || []).find(c => c.id === o.customerId)
      const customerName = cust ? `${cust.name} ${cust.lastName}` : `#${o.customerId}`
      return {
        orderId: o.id,
        customer: customerName,
        status: o.statusOrder || o.status || '',
        orderDate: o.createAt || o.createAt || '',
        amount: `$${total.toFixed(2)}`,
        actions: onOpenDetail ? (<Button variant="secondary" onClick={() => onOpenDetail(o)}>Ver detalle</Button>) : null,
        raw: o
      }
    })
  }

  const getCustomerName = (id) => {
    const c = (customers || []).find(x => x.id === id)
    return c ? `${c.name} ${c.lastName}` : `#${id}`
  }

  const formatCurrency = (value) => {
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
    } catch (e) {
      return `$${(value || 0).toFixed(2)}`
    }
  }

  const getCustomer = (id) => (customers || []).find(x => x.id === id)

  const getInitials = (cust) => {
    if (!cust) return ''
    const parts = `${cust.name || ''} ${cust.lastName || ''}`.trim().split(/\s+/)
    if (parts.length === 0) return ''
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const formatDate = (d) => {
    if (!d) return ''
    try {
      const dt = new Date(d)
      return dt.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
    } catch (e) {
      return d
    }
  }

  const statusBadge = (status) => {
    const s = (status || '').toLowerCase()
    let bg = '#f0ad4e'
    let color = '#fff'
    if (s.includes('pend')) { bg = '#f0ad4e'; color = '#fff' }
    if (s.includes('ship') || s.includes('enviado') || s.includes('shipped')) { bg = '#28a745'; color = '#fff' }
    if (s.includes('cancel') || s.includes('cancelled') || s.includes('cancelado')) { bg = '#dc3545'; color = '#fff' }
    return {
      background: bg,
      color,
      padding: '6px 10px',
      borderRadius: 16,
      fontWeight: 600,
      fontSize: 13
    }
  }

  const detailColumns = [
    { key: 'productName', label: 'Producto' },
    { key: 'quantity', label: 'Cantidad' },
    { key: 'priceUnit', label: 'Precio unidad' },
    { key: 'subtotal', label: 'Subtotal' }
  ]

  const detailData = (detailOrder?.details || []).map(item => ({
    id: item.id,
    productName: item.productName,
    quantity: item.quantity,
    priceUnit: `$${(item.priceUnit || 0).toFixed(2)}`,
    subtotal: `$${(((item.quantity || 0) * (item.priceUnit || 0))).toFixed(2)}`
  }))

  const detailTotal = (detailOrder?.details || []).reduce((s, it) => s + ((it.quantity || 0) * (it.priceUnit || 0)), 0)

  useEffect(() => {
    let mounted = true
  const apiUrl = (import.meta.env && import.meta.env.VITE_APIURL) ? import.meta.env.VITE_APIURL : 'http://localhost:8080/'
  ;(async () => {
    try {
      const url = `${apiUrl}customer/all`
      let span
      if (otelTracer && typeof otelTracer.startSpan === 'function') {
        span = otelTracer.startSpan('fetch.customers')
      }
      const headers = new Headers()
      if (span) {
        const ctx = otelTrace.setSpan(otelContext.active(), span)
        try {
          otelPropagation.inject(ctx, headers, {
            set: (carrier, key, value) => carrier.set(key, value)
          })
        } catch (e) {
          // ignore propagation errors
        }
      }

      const res = await fetch(url, { headers })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const ok = (Array.isArray(data) && data.length > 0)
      const toUse = ok ? data : fallbackCustomers
      if (mounted) {
        setCustomers(toUse)
        setCustomersFromEndpoint(Boolean(ok))
      }
      if (span) span.end()
    } catch (e) {
      if (mounted) {
        setCustomers(fallbackCustomers)
        setCustomersFromEndpoint(false)
      }
    }
  })()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    console.log('[example-app][Orders] mounted')
    try {
      if (typeof window !== 'undefined') {
        window.__EXAMPLE_APP_MOUNTED = true
        if (typeof window.__EXAMPLE_APP_DEPLOY_STATUS === 'function') {
          window.__EXAMPLE_APP_DEPLOY_STATUS('App mounted')
        } else {
          var el = document.getElementById('deploy-status')
          if (el) el.textContent = 'App mounted'
        }
      }
    } catch (e) {
      console.log('[example-app][Orders] failed to update deploy banner', e)
    }
  }, [])

  useEffect(() => {
    try {
      const envApiUrl = (import.meta && import.meta.env && import.meta.env.VITE_APIURL) ? import.meta.env.VITE_APIURL : null
      const envOrderUrl = (import.meta && import.meta.env && import.meta.env.VITE_ORDERURL) ? import.meta.env.VITE_ORDERURL : null
      console.log('[example-app][Orders] status', {
        customersFromEndpoint,
        ordersFromEndpoint,
        envApiUrl,
        envOrderUrl
      })
    } catch (e) {
      console.log('[example-app][Orders] status (error reading env)', e)
    }
  }, [customersFromEndpoint, ordersFromEndpoint])

  useEffect(() => {
    let mounted = true
    setLoading(true)
  const orderUrl = (import.meta.env && import.meta.env.VITE_ORDERURL) ? import.meta.env.VITE_ORDERURL : 'http://localhost:8081/'
  ;(async () => {
    try {
      const url = `${orderUrl}order/all`
      let span
      if (otelTracer && typeof otelTracer.startSpan === 'function') {
        span = otelTracer.startSpan('fetch.orders')
      }
      const headers = new Headers()
      if (span) {
        const ctx = otelTrace.setSpan(otelContext.active(), span)
        try {
          otelPropagation.inject(ctx, headers, { set: (carrier, key, value) => carrier.set(key, value) })
        } catch (e) {}
      }

      const res = await fetch(url, { headers })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const ok = (Array.isArray(data) && data.length > 0)
      const toUse = ok ? data : fallbackOrders
      if (mounted) {
        setOrdersRaw(toUse)
        setOrdersFromEndpoint(Boolean(ok))
      }
      if (span) span.end()
    } catch (err) {
      if (mounted) {
        setOrdersRaw(fallbackOrders)
        setOrdersFromEndpoint(false)
      }
      setError(err?.message || String(err))
    } finally { if (mounted) setLoading(false) }
  })()

    return () => { mounted = false }
  }, [])

  useEffect(() => {
    setTableData(mapOrdersToRows(ordersRaw.length ? ordersRaw : fallbackOrders, customers, openDetail))
  }, [ordersRaw, customers])

  const filteredData = useMemo(() => {
    return tableData.filter(r => {
      const matchesCustomer = !filterCustomer || r.customer.toLowerCase().includes(filterCustomer.toLowerCase())
      const matchesStatus = !filterStatus || filterStatus === '' || r.status === filterStatus
      return matchesCustomer && matchesStatus
    })
  }, [filterCustomer, filterStatus, tableData])

  return (
    <div>
      {/* <Header brand="DOJO IT 123" links={links} userName={user} /> */}

      <main style={{ padding: 40, position: 'relative', background: '#f9f9f9', minHeight: '100vh' }}>
        <h1>Ordenes</h1>

        <div style={{ marginTop: 16 }}>
          <FilterCard title="Filtros">
            <div style={{ display: 'grid', gridTemplateColumns: '200px 200px 1fr', gap: 12, alignItems: 'center' }}>
              <div>
                <div style={{ maxWidth: 200 }}>
                  <TextInput label="Cliente" value={filterCustomer} onChange={setFilterCustomer} placeholder="Buscar por cliente" />
                </div>
              </div>
              <div>
                <div style={{ maxWidth: 200 }}>
                  <Combobox options={statusOptions} value={filterStatus} onChange={setFilterStatus} ariaLabel="Estado" placeholder="Selecciona estado" searchable={true} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                {/* <Button variant="primary" onClick={openNewModal} style={{ height: 34, padding: '0 12px' }}>Nuevo</Button> */}
                <Button variant="secondary" onClick={() => { setFilterCustomer(''); setFilterStatus('') }} style={{ height: 34, padding: '0 12px' }}>Limpiar</Button>
              </div>
            </div>
          </FilterCard>
        </div>

        <div style={{ position: 'absolute', right: 24, top: 24 }}>
          <div style={{ width: 220, background: '#fff', borderRadius: 6, boxShadow: '0 6px 18px rgba(0,0,0,0.08)', padding: 12 }}>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>Service Customer</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 12, height: 12, borderRadius: 8, background: customersFromEndpoint ? '#28a745' : '#dc3545' }} />
              <div style={{ fontSize: 12, color: '#444' }}>{customersFromEndpoint ? 'Desde endpoint' : 'Usando JSON'}</div>
            </div>

            <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>Service Orders</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 12, height: 12, borderRadius: 8, background: ordersFromEndpoint ? '#28a745' : '#dc3545' }} />
              <div style={{ fontSize: 12, color: '#444' }}>{ordersFromEndpoint ? 'Desde endpoint' : 'Usando JSON'}</div>
            </div>
            
            <div style={{ height: 1, background: '#f1f1f1', margin: '10px 0' }} />
            <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>Variables de Entorno</div>
            {(() => {
              const envApiUrl = (import.meta.env && import.meta.env.VITE_APIURL) ? import.meta.env.VITE_APIURL : null
              const envOrderUrl = (import.meta.env && import.meta.env.VITE_ORDERURL) ? import.meta.env.VITE_ORDERURL : null
              const envApi = Boolean(envApiUrl)
              const envOrder = Boolean(envOrderUrl)
              const localUsed = !customersFromEndpoint || !ordersFromEndpoint
              return (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 8, background: localUsed ? '#28a745' : '#dc3545' }} />
                    <div style={{ fontSize: 12, color: '#444' }}>local</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 12, height: 12, borderRadius: 8, background: envApi ? '#28a745' : '#dc3545' }} />
                      <div style={{ fontSize: 12, color: '#444' }}>{envApiUrl || 'VITE_APIURL no definido'}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 12, height: 12, borderRadius: 8, background: envOrder ? '#28a745' : '#dc3545' }} />
                      <div style={{ fontSize: 12, color: '#444' }}>{envOrderUrl || 'VITE_ORDERURL no definido'}</div>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <Table columns={tableColumns} data={filteredData} headerStart="#0b5cff" headerEnd="#0044cc" headerText="#e8f7ff" />
        </div>
      </main>
      {/* Detail modal */}
      <Modal isOpen={detailModalOpen} headerStart="#0b5cff" headerEnd="#0044cc" headerText="#e8f7ff" onClose={() => setDetailModalOpen(false)} title={`Detalle orden #${detailOrder?.id || ''}`} secondaryAction={{ label: 'Cerrar', onClick: () => setDetailModalOpen(false) }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Card style={{ padding: 14, minHeight: 100 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <img src={clientImg} alt="cliente" style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover', boxShadow: '0 6px 18px rgba(11,92,255,0.12)' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#0b2a66' }}>{getCustomerName(detailOrder?.customerId)}</div>
                  <div style={{ color: '#666', marginTop: 6 }}>{getCustomer(detailOrder?.customerId)?.cellPhone || ''}</div>
                  <div style={{ marginTop: 8, color: '#444' }}><strong>Fecha:</strong> <span style={{ marginLeft: 8, fontWeight: 600 }}>{formatDate(detailOrder?.createAt)}</span></div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, minWidth: 160 }}>
                <div style={statusBadge(detailOrder?.statusOrder || detailOrder?.status)}>{detailOrder?.statusOrder || detailOrder?.status || ''}</div>
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                  <div style={{ background: 'linear-gradient(90deg,#0b5cff,#0044cc)', color: 'white', padding: '10px 18px', borderRadius: 12, textAlign: 'center', boxShadow: '0 8px 20px rgba(11,92,255,0.12)' }}>
                    <div style={{ fontSize: 12, opacity: 0.95 }}>Total</div>
                    <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>{formatCurrency(detailTotal)}</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
          {detailData && detailData.length > 0 ? (
            <div>
              <Table columns={detailColumns} data={detailData} headerStart="#0b5cff" headerEnd="#0044cc" headerText="#e8f7ff" />
            </div>
          ) : (
            <div>No hay detalles para esta orden.</div>
          )}
        </div>
      </Modal>

      <Modal isOpen={isModalOpen} headerStart="#0b5cff" headerEnd="#0044cc" headerText="#e8f7ff" onClose={() => setIsModalOpen(false)} title="Nuevo pedido" primaryAction={{ label: 'Crear', onClick: handleCreate }} secondaryAction={{ label: 'Cancelar', onClick: () => setIsModalOpen(false) }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <TextInput label="Cliente" value={modalCustomer} onChange={setModalCustomer} />
          <div style={{ width: 240 }}>
            <Combobox options={statusOptions.filter(o => o.value !== '')} value={modalStatus} onChange={setModalStatus} ariaLabel="Estado" placeholder="Selecciona estado" searchable={true} />
          </div>
        </div>
      </Modal>
    </div>
  )
}
