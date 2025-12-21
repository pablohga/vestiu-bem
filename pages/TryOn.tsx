import React, { useState, useRef, useEffect } from 'react';
import { Button, Card, LoadingSpinner } from '../components/UI';
import { ClothingItem, User } from '../types';
import { generateTryOnImage, fileToAsset } from '../services/gemini';
import { saveGeneratedImage, getClothingItems } from '../services/auth';

interface TryOnProps {
  user: User;
  onNavigate?: (page: string) => void;
}

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
  const [showShareMenu, setShowShareMenu] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const clothingInputRef = useRef<HTMLInputElement>(null);
  const shareMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load dynamic catalog
    const loadCatalog = async () => {
      const items = await getClothingItems();
      setCatalog(items);
    };
    loadCatalog();
  }, []);

  // Close share menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setShowShareMenu(false);
      }
    };

    if (showShareMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showShareMenu]);

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
      setSelectedClothing(null); // Deselect preset
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
      const userAsset = await fileToAsset(userImage);
      let clothingAsset;

      if (customClothingImage) {
        clothingAsset = await fileToAsset(customClothingImage);
      } else if (selectedClothing) {
        // Fetch the mock image and convert to blob then asset
        // Note: In production, you might need a proxy to avoid CORS issues if loading external images directly
        try {
          const response = await fetch(selectedClothing.image_url);
          const blob = await response.blob();
          const file = new File([blob], "clothing.jpg", { type: blob.type });
          clothingAsset = await fileToAsset(file);
        } catch (e) {
           throw new Error("Não foi possível carregar a imagem da roupa selecionada (Bloqueio CORS ou URL inválida). Tente fazer o upload manual da imagem.");
        }
      }

      if (!clothingAsset) throw new Error("Erro ao processar imagem da roupa");

      const generatedBase64 = await generateTryOnImage(userAsset, clothingAsset);
      const generatedUrl = `data:image/png;base64,${generatedBase64}`;
      
      setResultImage(generatedUrl);

      // Save to history
      await saveGeneratedImage({
        userId: user.id,
        originalUserImage: userImagePreview, // Ideally upload these to a cloud storage, here storing DataURL for demo
        clothingImage: customClothingPreview || selectedClothing?.image_url || '',
        resultImage: generatedUrl,
        clothingName: selectedClothing?.name || 'Roupa Personalizada'
      });

    } catch (err: any) {
      setError(err.message || "Erro desconhecido ao gerar imagem.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Detect if running on mobile device or Android webview
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.innerWidth <= 768);
  };

  // Detect if running in Android webview
  const isAndroidWebView = () => {
    const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
    return /Android/i.test(ua) && !/Chrome/i.test(ua) || /wv/i.test(ua);
  };

  const handleShare = async (platform?: string) => {
    if (!resultImage) return;

    let shareText = `Confira meu novo look criado com VestiuBem!`;
    
    if (selectedClothing) {
      shareText += `\n\nRoupa: ${selectedClothing.name}`;
      if (selectedClothing.shein_link && selectedClothing.shein_link !== '#') {
        shareText += `\nLink: ${selectedClothing.shein_link}`;
      }
    }
    
    const shareUrl = window.location.href;
    const mobile = isMobile();
    const androidWebView = isAndroidWebView();

    // Priority: Use Web Share API for Android webview or mobile (when no specific platform)
    if (!platform && (navigator.share || androidWebView)) {
      try {
        // For Android webview, try to use Web Share API with image
        if (navigator.share && navigator.canShare) {
          const response = await fetch(resultImage);
          const blob = await response.blob();
          const file = new File([blob], 'meu-look.png', { type: 'image/png' });
          
          const shareData: any = {
            title: 'Meu Look - VestiuBem',
            text: shareText,
            url: shareUrl
          };

          // Check if files can be shared (Android Chrome/WebView)
          if (navigator.canShare({ files: [file] })) {
            shareData.files = [file];
          }

          await navigator.share(shareData);
          setShowShareMenu(false);
          return;
        } else if (navigator.share) {
          // Fallback: share without file if canShare is not available
          await navigator.share({
            title: 'Meu Look - VestiuBem',
            text: shareText,
            url: shareUrl
          });
          setShowShareMenu(false);
          return;
        }
      } catch (err) {
        // User cancelled or error, fall through to platform-specific sharing
        if ((err as Error).name !== 'AbortError') {
          console.error('Error sharing:', err);
          // If Web Share API fails in webview, continue to platform-specific options
        } else {
          // User cancelled, just close menu
          setShowShareMenu(false);
          return;
        }
      }
    }

    // Platform-specific sharing
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(shareUrl);

    let shareLink = '';

    switch (platform) {
      case 'whatsapp':
        if (mobile) {
          // Mobile: Use WhatsApp app protocol (iOS/Android)
          shareLink = `whatsapp://send?text=${encodedText}%20${encodedUrl}`;
        } else {
          // Web: Open WhatsApp Web
          shareLink = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
        }
        break;
      case 'facebook':
        if (mobile) {
          // Mobile: Try Facebook app protocol first
          shareLink = `fb://share?text=${encodedText}&href=${encodedUrl}`;
        } else {
          // Web: Open Facebook share dialog
          shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
        }
        break;
      case 'twitter':
        if (mobile) {
          // Mobile: Use Twitter app protocol
          shareLink = `twitter://post?message=${encodedText}%20${encodedUrl}`;
        } else {
          // Web: Open Twitter share dialog
          shareLink = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
        }
        break;
      case 'instagram':
        // Instagram doesn't support direct sharing via URL, so we'll copy the image
        try {
          const response = await fetch(resultImage);
          const blob = await response.blob();
          const clipboardItem = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([clipboardItem]);
          alert('Imagem copiada! Cole no Instagram para compartilhar.');
          setShowShareMenu(false);
          return;
        } catch (err) {
          alert('Não foi possível copiar a imagem. Tente baixar a imagem e compartilhar manualmente.');
          return;
        }
      case 'copy-link':
        try {
          await navigator.clipboard.writeText(shareUrl);
          alert('Link copiado para a área de transferência!');
          setShowShareMenu(false);
          return;
        } catch (err) {
          alert('Não foi possível copiar o link.');
          return;
        }
      default:
        return;
    }

    if (shareLink) {
      if (mobile && (platform === 'whatsapp' || platform === 'facebook' || platform === 'twitter')) {
        // For mobile, try to open app directly using app protocol
        // The OS will handle fallback if app is not installed
        window.location.href = shareLink;
      } else {
        // For web desktop, open in new window
        window.open(shareLink, '_blank', 'width=600,height=400');
      }
      setShowShareMenu(false);
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

          <p className="text-xl font-semibold text-gray-500 mb-2">Ou escolha do catálogo Shein:</p>
          {catalog.length === 0 ? (
            <p className="text-xs text-gray-400 italic p-2">Nenhum item no catálogo. Adicione via Admin.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 min-h-[750px] overflow-y-auto pr-1">
              {catalog.map(item => (
                <div
                  key={item.id}
                  className={`min-h-[350px] cursor-pointer rounded-lg overflow-hidden border-2 relative group ${selectedClothing?.id === item.id ? 'border-brand-500 ring-2 ring-brand-200' : 'border-transparent'}`}
                  onClick={() => handleSelectClothing(item)}
                >
                  <img src={item?.image_url || '/fallback.png'} alt={item.name} className="w-full h-80 object-cover" />
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
                <img src={resultImage} alt="Resultado" className="max-h-[70vh] rounded-lg shadow-2xl mb-6 object-contain" />
                <div className="flex gap-4 flex-wrap justify-center">
                  <a href={resultImage} download="meu-look-vestiubem.png">
                    <Button variant="outline">⬇️ Baixar Imagem</Button>
                  </a>
                  {selectedClothing && selectedClothing.shein_link && selectedClothing.shein_link !== '#' ? (
                    <a href={selectedClothing.shein_link} target="_blank" rel="noopener noreferrer">
                      <Button>🛍️ Comprar na Shein</Button>
                    </a>
                  ) : (
                    <Button onClick={() => onNavigate?.('shein-gallery')}>
                      🛍️ Comprar na Shein
                    </Button>
                  )}
                  <div className="relative" ref={shareMenuRef}>
                    <Button 
                      onClick={() => {
                        // In Android webview, directly trigger native share
                        if (isAndroidWebView() && navigator.share) {
                          handleShare();
                        } else {
                          // Otherwise, show menu
                          setShowShareMenu(!showShareMenu);
                        }
                      }}
                    >
                      📤 Compartilhar Look
                    </Button>
                    {showShareMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50 py-2">
                        <button
                          onClick={() => handleShare()}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
                        >
                          <span>📱</span>
                          <span>Compartilhar (Nativo)</span>
                        </button>
                        <button
                          onClick={() => handleShare('whatsapp')}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
                        >
                          <span>💬</span>
                          <span>WhatsApp</span>
                        </button>
                        <button
                          onClick={() => handleShare('facebook')}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
                        >
                          <span>👥</span>
                          <span>Facebook</span>
                        </button>
                        <button
                          onClick={() => handleShare('twitter')}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
                        >
                          <span>🐦</span>
                          <span>Twitter</span>
                        </button>
                        <button
                          onClick={() => handleShare('instagram')}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
                        >
                          <span>📷</span>
                          <span>Instagram (Copiar)</span>
                        </button>
                        <div className="border-t border-gray-200 my-1"></div>
                        <button
                          onClick={() => handleShare('copy-link')}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
                        >
                          <span>🔗</span>
                          <span>Copiar Link</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
        </Card>
      </div>
    </div>
  );
};