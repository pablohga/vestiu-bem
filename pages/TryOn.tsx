import React, { useState, useRef, useEffect } from 'react';
import { Button, Card, LoadingSpinner } from '../components/UI';
import { ClothingItem, User } from '../types';
import { generateTryOnImage, fileToAsset } from '../services/gemini';
import { saveGeneratedImage, getClothingItems } from '../services/auth';

interface TryOnProps {
  user: User;
  onNavigate?: (page: string) => void;
}

// Helper: Converte HTTP para HTTPS
const ensureHttps = (url: string): string => {
  if (!url) return url;
  return url.replace(/^http:\/\//i, 'https://');
};

// Helper: Converte URL de imagem em File usando proxy CORS
const urlToFile = async (url: string, filename: string = 'clothing.jpg'): Promise<File> => {
  try {
    // Garantir HTTPS
    const httpsUrl = ensureHttps(url);
    console.log('🔄 Convertendo URL:', httpsUrl);
    
    // Usar um proxy CORS público
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(httpsUrl)}`;
    
    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'Accept': 'image/*'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    console.log('✅ Imagem carregada, tamanho:', blob.size);
    
    return new File([blob], filename, { type: blob.type || 'image/jpeg' });
  } catch (error: any) {
    console.error('❌ Erro ao carregar imagem:', error);
    throw new Error(`Não foi possível carregar a imagem: ${error.message}`);
  }
};

export const TryOn: React.FC<TryOnProps> = ({ user, onNavigate }) => {
  const [userImage, setUserImage] = useState<File | null>(null);
  const [userImagePreview, setUserImagePreview] = useState<string>('');
  const [catalog, setCatalog] = useState<ClothingItem[]>([]);
  const [selectedClothing, setSelectedClothing] = useState<ClothingItem | null>(null);
  const [customClothingImage, setCustomClothingImage] = useState<File | null>(null);
  const [customClothingPreview, setCustomClothingPreview] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const clothingInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const items = await getClothingItems();
        console.log('📦 Catálogo carregado:', items.length, 'itens');
        setCatalog(items);
      } catch (error) {
        console.error('❌ Erro ao carregar catálogo:', error);
      }
    };
    loadCatalog();
  }, []);

  const handleUserImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUserImage(file);
      setUserImagePreview(URL.createObjectURL(file));
      setResultImage(null);
    }
  };

  const handleCustomClothingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCustomClothingImage(file);
      setCustomClothingPreview(URL.createObjectURL(file));
      setSelectedClothing(null);
      setResultImage(null);
    }
  };

  const handleSelectClothing = (item: ClothingItem) => {
    setSelectedClothing(item);
    setCustomClothingImage(null);
    setCustomClothingPreview('');
    setResultImage(null);
  };

  const handleGenerate = async () => {
    if (!userImage) {
      setError('Por favor, envie sua foto primeiro.');
      return;
    }

    if (!selectedClothing && !customClothingImage) {
      setError('Por favor, selecione uma roupa ou envie uma foto de roupa.');
      return;
    }

    setIsGenerating(true);
    setError('');
    setResultImage(null);

    try {
      console.log('🎨 Iniciando geração de imagem...');
      
      const userAsset = await fileToAsset(userImage);
      console.log('✅ Imagem do usuário processada');

      let clothingAsset;

      if (customClothingImage) {
        console.log('📤 Usando imagem personalizada do usuário');
        clothingAsset = await fileToAsset(customClothingImage);
      } else if (selectedClothing) {
        console.log('🛍️ Carregando imagem do catálogo:', selectedClothing.name);
        console.log('🔗 URL:', selectedClothing.image_url);
        
        try {
          const clothingFile = await urlToFile(
            selectedClothing.image_url,
            `${selectedClothing.id}.jpg`
          );
          clothingAsset = await fileToAsset(clothingFile);
          console.log('✅ Imagem da roupa processada');
        } catch (fetchError: any) {
          console.error('❌ Erro ao carregar imagem da roupa:', fetchError);
          throw new Error(
            'Não foi possível carregar a imagem da roupa selecionada. ' +
            'Tente fazer o upload manual da imagem ou escolha outro item do catálogo.'
          );
        }
      }

      if (!clothingAsset) {
        throw new Error('Erro ao processar imagem da roupa');
      }

      console.log('🤖 Enviando para IA Gemini...');
      const generatedBase64 = await generateTryOnImage(userAsset, clothingAsset);
      const generatedUrl = `data:image/png;base64,${generatedBase64}`;
      
      console.log('✅ Imagem gerada com sucesso!');
      setResultImage(generatedUrl);

      // Save to history
      await saveGeneratedImage({
        userId: user.id,
        originalUserImage: userImagePreview,
        clothingImage: customClothingPreview || selectedClothing?.image_url || '',
        resultImage: generatedUrl,
        clothingName: selectedClothing?.name || 'Roupa Personalizada'
      });

      console.log('💾 Imagem salva no histórico');
    } catch (err: any) {
      console.error('❌ Erro na geração:', err);
      setError(err.message || 'Erro desconhecido ao gerar imagem.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Panel: Inputs */}
      <div className="lg:col-span-4 space-y-6">
        {/* Step 1: User Photo */}
        <Card>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="bg-brand-100 text-brand-700 w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
            Sua Foto
          </h2>
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors aspect-[3/4] flex flex-col items-center justify-center relative overflow-hidden"
            onClick={() => fileInputRef.current?.click()}
          >
            {userImagePreview ? (
              <img src={userImagePreview} alt="User" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="text-gray-400">
                <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="mt-2 text-sm">Clique para enviar foto</p>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleUserImageChange}
            />
          </div>
        </Card>

        {/* Step 2: Clothing Selection */}
        <Card>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="bg-brand-100 text-brand-700 w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
            Escolha a Roupa
          </h2>
          
          <div className="mb-4">
            <div
              className={`border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors h-24 flex items-center justify-center ${customClothingPreview ? 'border-brand-500 bg-brand-50' : ''}`}
              onClick={() => clothingInputRef.current?.click()}
            >
              {customClothingPreview ? (
                <div className="flex items-center gap-2">
                  <img src={customClothingPreview} className="h-16 w-16 object-cover rounded" />
                  <span className="text-sm font-medium text-brand-700">Imagem enviada</span>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Enviar foto de roupa personalizada</p>
              )}
              <input
                type="file"
                ref={clothingInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleCustomClothingChange}
              />
            </div>
          </div>

          <p className="text-sm font-semibold text-gray-500 mb-2">Ou escolha do catálogo Shein:</p>
          
          {catalog.length === 0 ? (
            <p className="text-xs text-gray-400 italic p-2">Nenhum item no catálogo. Adicione via Admin.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-[500px] overflow-y-auto pr-1">
              {catalog.map(item => (
                <div
                  key={item.id}
                  className={`min-h-[250px] cursor-pointer rounded-lg overflow-hidden border-2 relative group ${selectedClothing?.id === item.id ? 'border-brand-500 ring-2 ring-brand-200' : 'border-transparent'}`}
                  onClick={() => handleSelectClothing(item)}
                >
                  <img 
                    src={ensureHttps(item.image_url) || '/fallback.png'} 
                    alt={item.name} 
                    className="w-full h-48 object-cover"
                    loading="lazy"
                  />
                  <div className="p-1.5 bg-white">
                    <div className="text-xs font-medium truncate">{item.name}</div>
                    <div className="text-[10px] text-gray-500 truncate">{item.description}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Button
          className="w-full py-4 text-lg shadow-lg shadow-brand-200 flex items-center justify-center gap-2"
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? <><LoadingSpinner /> Processando...</> : '✨ Provador Virtual'}
        </Button>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
            {error}
          </div>
        )}
      </div>

      {/* Right Panel: Result */}
      <div className="lg:col-span-8">
        <Card className="h-full min-h-[500px] flex flex-col items-center justify-center bg-gray-50/50">
          {!resultImage && !isGenerating && (
            <div className="text-center text-gray-400 p-8">
              <div className="text-6xl mb-4">👗</div>
              <h3 className="text-xl font-semibold mb-2">Pronta para experimentar?</h3>
              <p>Envie sua foto e escolha uma roupa para ver a mágica acontecer.</p>
            </div>
          )}

          {isGenerating && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-600 mx-auto mb-4"></div>
              <p className="text-brand-600 font-medium animate-pulse">A IA está desenhando seu novo look...</p>
            </div>
          )}

          {resultImage && (
            <div className="w-full h-full flex flex-col items-center animate-fade-in">
              <img 
                src={resultImage} 
                alt="Resultado" 
                className="max-h-[70vh] rounded-lg shadow-2xl mb-6 object-contain" 
              />
              <div className="flex gap-4">
                <a href={resultImage} download="meu-look-vestiubem.png">
                  <Button variant="outline">💾 Baixar Imagem</Button>
                </a>
                <Button onClick={() => onNavigate?.('shein-gallery')}>
                  🛍️ Comprar na Shein
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};