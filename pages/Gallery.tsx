import React, { useEffect, useState } from 'react';
import { GeneratedImage, User } from '../types';
import { getUserImages } from '../services/auth';
import { Card, LoadingSpinner } from '../components/UI';

export const Gallery: React.FC<{ user: User }> = ({ user }) => {
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadImages = async () => {
      const imgs = await getUserImages(user.id);
      setImages(imgs);
      setLoading(false);
    };
    loadImages();
  }, [user.id]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Minha Galeria</h1>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner />
          <span className="ml-2 text-gray-500">Carregando imagens...</span>
        </div>
      ) : images.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-500">Você ainda não gerou nenhuma imagem. Vá ao provador!</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {images.map(img => (
            <Card key={img.id} className="group hover:shadow-lg transition-shadow overflow-hidden p-0">
              <div className="relative aspect-[3/4] overflow-hidden">
                <img src={img.resultImage} alt="Generated" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                   <a href={img.resultImage} download={`vestiubem-${img.id}.png`} className="text-white text-sm font-medium hover:underline">
                     Baixar
                   </a>
                </div>
              </div>
              <div className="p-3">
                <p className="font-medium text-gray-900 text-sm truncate">{img.clothingName}</p>
                <p className="text-xs text-gray-500">{new Date(img.createdAt).toLocaleDateString()}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
