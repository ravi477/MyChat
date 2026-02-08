import React, { useEffect, useCallback } from 'react';
import { X, Download, ZoomIn, ZoomOut } from 'lucide-react';

interface ImageLightboxProps {
    imageUrl: string;
    isOpen: boolean;
    onClose: () => void;
}

const ImageLightbox: React.FC<ImageLightboxProps> = ({ imageUrl, isOpen, onClose }) => {
    const [scale, setScale] = React.useState(1);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
        if (e.key === '+' || e.key === '=') setScale(s => Math.min(s + 0.25, 3));
        if (e.key === '-') setScale(s => Math.max(s - 0.25, 0.5));
    }, [onClose]);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, handleKeyDown]);

    useEffect(() => {
        if (isOpen) setScale(1);
    }, [isOpen, imageUrl]);

    if (!isOpen) return null;

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `image_${Date.now()}.jpg`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                animation: 'fadeIn 0.2s ease-out'
            }}
            onClick={onClose}
        >
            {/* Header Bar */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 24px',
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => setScale(s => Math.max(s - 0.25, 0.5))}
                        style={toolbarButtonStyle}
                        title="Zoom Out"
                    >
                        <ZoomOut size={20} />
                    </button>
                    <span style={{ color: 'white', fontSize: '14px', padding: '8px 12px' }}>
                        {Math.round(scale * 100)}%
                    </span>
                    <button
                        onClick={() => setScale(s => Math.min(s + 0.25, 3))}
                        style={toolbarButtonStyle}
                        title="Zoom In"
                    >
                        <ZoomIn size={20} />
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={handleDownload}
                        style={toolbarButtonStyle}
                        title="Download"
                    >
                        <Download size={20} />
                    </button>
                    <button
                        onClick={onClose}
                        style={toolbarButtonStyle}
                        title="Close (Esc)"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Image Container */}
            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'auto',
                    padding: '20px'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <img
                    src={imageUrl}
                    alt="Full size"
                    style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain',
                        transform: `scale(${scale})`,
                        transition: 'transform 0.2s ease-out',
                        borderRadius: '8px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        cursor: scale > 1 ? 'grab' : 'default'
                    }}
                    onClick={onClose}
                />
            </div>

            {/* Hint */}
            <div style={{
                textAlign: 'center',
                padding: '16px',
                color: 'rgba(255,255,255,0.5)',
                fontSize: '12px'
            }}>
                Press Esc to close • +/- to zoom
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </div>
    );
};

const toolbarButtonStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.1)',
    border: 'none',
    borderRadius: '8px',
    padding: '8px',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s'
};

export default ImageLightbox;
