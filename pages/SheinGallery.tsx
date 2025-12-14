import React, { useEffect, useState } from 'react';
import { ClothingItem } from '../types';
import { getClothingItems } from '../services/auth';
import { Card, Button } from '../components/UI';

export const SheinGallery: React.FC = () => {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadItems = async () => {
      try {
        const clothingItems = await getClothingItems();
        setItems(clothingItems);
      } catch (error) {
        console.error('Error loading clothing items:', error);
      } finally {
        setLoading(false);
      }
    };
    loadItems();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
          Seleção Shein Especial do VestiuBem
        </h1>

        {items.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-gray-500">Nenhum produto disponível no momento.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {items.map(item => (
              <Card key={item.id} className="group hover:shadow-lg transition-shadow overflow-hidden">
                <div className="relative aspect-[3/4] overflow-hidden">
                  <img
                    src={item.image_url || '/fallback.png'}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 text-sm mb-2 truncate">{item.name}</h3>
                  <p className="text-xs text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-brand-600">
                      R$ {item.price.toFixed(2)}
                    </span>
                    {item.shein_link && item.shein_link !== '#' && (
                      <a href={item.shein_link} target="_blank" rel="noopener noreferrer">
                        <Button size="sm">Comprar</Button>
                      </a>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
