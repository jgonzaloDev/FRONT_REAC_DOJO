import React, { useState, useMemo } from 'react'
import { Button, Header, FilterCard, Table, TextInput, Combobox, Modal, Card } from 'storybook-dojo-react'

export default function Dashboard() {
  const logout = () => {
    sessionStorage.removeItem('user')
    window.location.href = '/'
  }

  const user = (() => {
    try {
      return JSON.parse(sessionStorage.getItem('user'))?.user || 'Usuario'
    } catch (e) {
      return 'Usuario'
    }
  })()

  const links = [
    { key: 'home', label: 'Inicio', href: '/' },
    { key: 'orders', label: 'Orders', href: '/orders' }
  ]

  const tableColumns = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'name', label: 'Nombre' },
    { key: 'role', label: 'Rol' }
  ]

  const [tableData, setTableData] = useState([
    { id: 1, name: 'Ana Perez', role: 'Admin' },
    { id: 2, name: 'Luis Gomez', role: 'User' },
    { id: 3, name: 'Carla Ruiz', role: 'Viewer' }
  ])

  const [filterName, setFilterName] = useState('')
  const [filterRole, setFilterRole] = useState('')

  const roleOptions = [
    { value: '', label: 'Todos' },
    { value: 'Admin', label: 'Admin' },
    { value: 'User', label: 'User' },
    { value: 'Viewer', label: 'Viewer' }
  ]

  // Modal state for creating new
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalName, setModalName] = useState('')
  const [modalRole, setModalRole] = useState('')

  const openNewModal = () => {
    setModalName('')
    setModalRole('')
    setIsModalOpen(true)
  }

  const handleCreate = () => {
    const nextId = tableData.length ? Math.max(...tableData.map(d => d.id)) + 1 : 1
    setTableData([...tableData, { id: nextId, name: modalName || 'Sin nombre', role: modalRole || 'User' }])
    setIsModalOpen(false)
  }

  const filteredData = useMemo(() => {
    return tableData.filter(r => {
      const matchesName = !filterName || r.name.toLowerCase().includes(filterName.toLowerCase())
      const matchesRole = !filterRole || filterRole === '' || r.role === filterRole
      return matchesName && matchesRole
    })
  }, [filterName, filterRole, tableData])

  return (
    <div>
      <Header brand="DOJO IT 123" links={links} userName={user} />

      <main style={{ padding: 40, position: 'relative' }}>
        <div style={{ position: 'absolute', right: 24, top: 8 }}>
          <Button variant="primary" onClick={logout} style={{ height: 36, padding: '0 12px' }}>Cerrar sesión</Button>
        </div>

        <h1>Dashboard</h1>
        <p>Bienvenido, {user}.</p>

        <div style={{ marginTop: 16 }}>
          <FilterCard title="Filtros">
            <div style={{ display: 'grid', gridTemplateColumns: '160px 200px 1fr', gap: 12, alignItems: 'center' }}>
              <div>
                <div style={{ maxWidth: 160 }}>
                  <TextInput label="Nombre" value={filterName} onChange={setFilterName} placeholder="Buscar por nombre" />
                </div>
              </div>
              <div>
                <div style={{ maxWidth: 200 }}>
                  <Combobox options={roleOptions} value={filterRole} onChange={setFilterRole} ariaLabel="Rol" placeholder="Selecciona rol" searchable={true} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                <Button variant="primary" onClick={openNewModal} style={{ height: 34, padding: '0 12px', fontSize: '0.92rem', lineHeight: '34px' }}>Nuevo</Button>
                <Button variant="secondary" onClick={() => { setFilterName(''); setFilterRole('') }} style={{ height: 34, padding: '0 12px', fontSize: '0.92rem', lineHeight: '34px' }}>Limpiar</Button>
              </div>
            </div>
          </FilterCard>
        </div>

        <div style={{ marginTop: 20 }}>
          <Table columns={tableColumns} data={filteredData} headerStart="#30e851ff" headerEnd="#04df04ff" headerText="#e8f7ff" />
        </div>
      </main>

      <Modal isOpen={isModalOpen} headerStart="#0b5cff" headerEnd="#0044cc" headerText="#e8f7ff" onClose={() => setIsModalOpen(false)} title="Nuevo registro" primaryAction={{ label: 'Crear', onClick: handleCreate }} secondaryAction={{ label: 'Cancelar', onClick: () => setIsModalOpen(false) }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <TextInput label="Nombre" value={modalName} onChange={setModalName} />
          <div style={{ width: 240 }}>
            <Combobox options={roleOptions.filter(o => o.value !== '')} value={modalRole} onChange={setModalRole} ariaLabel="Rol" placeholder="Selecciona rol" searchable={true} />
          </div>
        </div>
      </Modal>
    </div>
  )
}
