import React, { useEffect, useState } from 'react';
import { User, UserRole, ClothingItem } from '../types';
import { getAllUsers, deleteUser, getClothingItems, addClothingItem, updateClothingItem, deleteClothingItem } from '../services/auth';
import { Card, Button, Input, LoadingSpinner } from '../components/UI';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'catalog'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [catalog, setCatalog] = useState<ClothingItem[]>([]);

  // New Item Form State
  const [newItemName, setNewItemName] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemImage, setNewItemImage] = useState('');
  const [newItemLink, setNewItemLink] = useState('');

  // Edit Item State
  const [editingItem, setEditingItem] = useState<ClothingItem | null>(null);
  const [editItemName, setEditItemName] = useState('');
  const [editItemDesc, setEditItemDesc] = useState('');
  const [editItemPrice, setEditItemPrice] = useState('');
  const [editItemImage, setEditItemImage] = useState('');
  const [editItemLink, setEditItemLink] = useState('');

  // Loading State
  const [isAddingItem, setIsAddingItem] = useState(false);

  const loadData = async () => {
    const [usersData, catalogData] = await Promise.all([
      getAllUsers(),
      getClothingItems()
    ]);
    setUsers(usersData);
    setCatalog(catalogData);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteUser = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      deleteUser(id);
      loadData();
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName || !newItemImage) {
      alert('Nome e URL da imagem são obrigatórios');
      return;
    }

    setIsAddingItem(true);
    try {
      await addClothingItem({
        name: newItemName,
        description: newItemDesc,
        price: parseFloat(newItemPrice) || 0,
        image_url: newItemImage,
        shein_link: newItemLink || '#'
      });

      // Reset form
      setNewItemName('');
      setNewItemDesc('');
      setNewItemPrice('');
      setNewItemImage('');
      setNewItemLink('');

      loadData();
      alert('Item adicionado ao catálogo!');
    } catch (error: any) {
      console.error('Erro ao adicionar item:', error);
      const errorMessage = error?.message || 'Erro desconhecido ao adicionar item';
      alert(`Erro ao adicionar item: ${errorMessage}`);
    } finally {
      setIsAddingItem(false);
    }
  };

  const handleEditItem = (item: ClothingItem) => {
    setEditingItem(item);
    setEditItemName(item.name);
    setEditItemDesc(item.description || '');
    setEditItemPrice(item.price.toString());
    setEditItemImage(item.image_url);
    setEditItemLink(item.shein_link);
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditItemName('');
    setEditItemDesc('');
    setEditItemPrice('');
    setEditItemImage('');
    setEditItemLink('');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editItemName || !editItemImage) {
      alert('Nome e URL da imagem são obrigatórios');
      return;
    }

    try {
      await updateClothingItem(editingItem.id, {
        name: editItemName,
        description: editItemDesc || undefined,
        price: parseFloat(editItemPrice) || 0,
        image_url: editItemImage,
        shein_link: editItemLink || '#'
      });

      handleCancelEdit();
      loadData();
      alert('Item atualizado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao atualizar item:', error);
      const errorMessage = error?.message || 'Erro desconhecido ao atualizar item';
      alert(`Erro ao atualizar item: ${errorMessage}`);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este item do catálogo?')) {
      try {
        await deleteClothingItem(id);
        // Atualiza o estado localmente removendo o item da lista
        setCatalog(prevCatalog => prevCatalog.filter(item => item.id !== id));
        alert('Item removido com sucesso!');
      } catch (error: any) {
        console.error('Erro ao remover item:', error);
        const errorMessage = error?.message || 'Erro desconhecido ao remover item';
        alert(`Erro ao remover item: ${errorMessage}`);
        // Em caso de erro, recarrega os dados para garantir sincronização
        await loadData();
      }
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Painel Administrativo</h1>
        <div className="flex space-x-2">
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'users' ? 'bg-brand-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
          >
            Usuários
          </button>
          <button 
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'catalog' ? 'bg-brand-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
          >
            Catálogo Shein
          </button>
        </div>
      </div>

      {activeTab === 'users' ? (
        <Card className="overflow-hidden">
           <div className="bg-brand-50 p-4 border-b border-brand-100 mb-4 rounded-t-lg">
             <span className="text-brand-800 font-bold">Total Usuários: {users.length}</span>
           </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Função</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map(u => (
                  <tr key={u.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold">
                          {u.name.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{u.name}</div>
                          <div className="text-xs text-gray-500">ID: {u.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {u.role !== UserRole.ADMIN && (
                        <button 
                          onClick={() => handleDeleteUser(u.id)} 
                          className="text-red-600 hover:text-red-900"
                        >
                          Excluir
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Add Item Form */}
          <Card>
            <h2 className="text-xl font-bold mb-4 text-gray-800">Adicionar Produto ao Catálogo</h2>
            <br />
            <a href="https://m.shein.com/br/affiliate/product-ranking" target="_blank" rel="noopener noreferrer">
              <h3>- Clique aqui para Catalogo de produtos da Shein </h3> 
            </a>
            <br />
            <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                 <Input 
                  label="Nome do Produto" 
                  value={newItemName} 
                  onChange={e => setNewItemName(e.target.value)} 
                  placeholder="Ex: Vestido Longo Floral"
                  required
                 />
              </div>
              <Input 
                label="URL da Imagem (Link Direto)" 
                value={newItemImage} 
                onChange={e => setNewItemImage(e.target.value)} 
                placeholder="https://..."
                required
              />
              <Input 
                label="Link da Loja (Shein)" 
                value={newItemLink} 
                onChange={e => setNewItemLink(e.target.value)} 
                placeholder="https://br.shein.com/..."
              />
              <Input 
                label="Preço (R$)" 
                type="number" 
                step="0.01"
                value={newItemPrice} 
                onChange={e => setNewItemPrice(e.target.value)} 
                placeholder="0.00"
              />
              <Input 
                label="Descrição Curta" 
                value={newItemDesc} 
                onChange={e => setNewItemDesc(e.target.value)} 
                placeholder="Detalhes sobre o tecido, ocasião..."
              />
              <div className="md:col-span-2 flex justify-end mt-2">
                <Button type="submit" disabled={isAddingItem} className="flex items-center justify-center gap-2">
                  {isAddingItem ? (
                    <>
                      <LoadingSpinner />
                      Adicionando...
                    </>
                  ) : (
                    'Adicionar Produto'
                  )}
                </Button>
              </div>
            </form>
          </Card>

          {/* Edit Item Form */}
          {editingItem && (
            <Card>
              <h2 className="text-xl font-bold mb-4 text-gray-800">Editar Produto</h2>
              <form onSubmit={handleSaveEdit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Input
                    label="Nome do Produto"
                    value={editItemName}
                    onChange={e => setEditItemName(e.target.value)}
                    placeholder="Ex: Vestido Longo Floral"
                    required
                  />
                </div>
                <Input
                  label="URL da Imagem (Link Direto)"
                  value={editItemImage}
                  onChange={e => setEditItemImage(e.target.value)}
                  placeholder="https://..."
                  required
                />
                <Input
                  label="Link da Loja (Shein)"
                  value={editItemLink}
                  onChange={e => setEditItemLink(e.target.value)}
                  placeholder="https://br.shein.com/..."
                />
                <Input
                  label="Preço (R$)"
                  type="number"
                  step="0.01"
                  value={editItemPrice}
                  onChange={e => setEditItemPrice(e.target.value)}
                  placeholder="0.00"
                />
                <Input
                  label="Descrição Curta"
                  value={editItemDesc}
                  onChange={e => setEditItemDesc(e.target.value)}
                  placeholder="Detalhes sobre o tecido, ocasião..."
                />
                <div className="md:col-span-2 flex justify-end gap-2 mt-2">
                  <Button type="button" variant="outline" onClick={handleCancelEdit}>
                    Cancelar
                  </Button>
                  <Button type="submit">Salvar Alterações</Button>
                </div>
              </form>
            </Card>
          )}

          {/* Catalog List */}
          <h2 className="text-xl font-bold text-gray-800 mt-8">Itens Cadastrados ({catalog.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {catalog.map(item => (
              <Card key={item.id} className="relative group hover:shadow-lg transition-shadow">
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-1">
                  <button
                    onClick={() => handleEditItem(item)}
                    className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 shadow-sm"
                    title="Editar Item"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 shadow-sm"
                    title="Remover Item"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-40 object-cover rounded-md mb-2 bg-gray-100"
                  onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/400?text=Imagem+Indisponível')}
                />
                <h3 className="font-semibold text-gray-900 truncate" title={item.name}>{item.name}</h3>
                <p className="text-sm text-brand-600 font-bold">R$ {item.price.toFixed(2)}</p>
                {item.description && <p className="text-xs text-gray-500 mt-1 truncate">{item.description}</p>}
                <a
                  href={item.shein_link}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-500 hover:underline mt-2 block"
                >
                  Ver na Loja
                </a>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};