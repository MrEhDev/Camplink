import React, { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Check, Crop, Move } from 'lucide-react';
import { comprimirFotoPerfil } from '../utils/imageCompressor';

export default function ModalRecortarFotoPerfil({ archivoOriginal, alConfirmar, alCancelar }) {
  const [imagenSrc, setImagenSrc] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [posicion, setPosicion] = useState({ x: 0, y: 0 });
  const [arrastrando, setArrastrando] = useState(false);
  const [origenArrastre, setOrigenArrastre] = useState({ x: 0, y: 0 });
  const [procesando, setProcesando] = useState(false);
  const [dimensionesBase, setDimensionesBase] = useState({ ancho: 280, alto: 280 });

  const contenedorRef = useRef(null);
  const imgRef = useRef(null);
  const TAMANO_BOX = 280;

  // Cargar imagen a partir del archivo seleccionado
  useEffect(() => {
    if (!archivoOriginal) return;
    const url = URL.createObjectURL(archivoOriginal);
    setImagenSrc(url);
    setZoom(1);
    setPosicion({ x: 0, y: 0 });

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [archivoOriginal]);

  // Al cargar los metadatos de la imagen, calcular escala base para que quepa bien dentro del marco 1:1
  const alCargarImagen = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    if (!naturalWidth || !naturalHeight) return;

    // Ajustar para que el lado más corto sea al menos igual al contenedor (280px),
    // permitiendo ver la foto completa sin zoom exagerado inicial.
    let baseW = TAMANO_BOX;
    let baseH = TAMANO_BOX;

    if (naturalWidth > naturalHeight) {
      baseW = (naturalWidth / naturalHeight) * TAMANO_BOX;
      baseH = TAMANO_BOX;
    } else {
      baseH = (naturalHeight / naturalWidth) * TAMANO_BOX;
      baseW = TAMANO_BOX;
    }

    setDimensionesBase({ ancho: baseW, alto: baseH });
  };

  // Manejo de arrastre con ratón o táctil
  const iniciarArrastre = (clientX, clientY) => {
    setArrastrando(true);
    setOrigenArrastre({
      x: clientX - posicion.x,
      y: clientY - posicion.y
    });
  };

  const mover = (clientX, clientY) => {
    if (!arrastrando) return;
    setPosicion({
      x: clientX - origenArrastre.x,
      y: clientY - origenArrastre.y
    });
  };

  const terminarArrastre = () => {
    setArrastrando(false);
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    iniciarArrastre(e.clientX, e.clientY);
  };

  const handleMouseMove = (e) => {
    mover(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    terminarArrastre();
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      iniciarArrastre(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1) {
      mover(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchEnd = () => {
    terminarArrastre();
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY * -0.0015;
    setZoom(prev => Math.min(Math.max(0.5, prev + delta), 3.0));
  };

  const restablecer = () => {
    setZoom(1);
    setPosicion({ x: 0, y: 0 });
  };

  // Generar recorte final 1:1 en Canvas y comprimir
  const recortarYAplicar = async () => {
    if (!imgRef.current || !contenedorRef.current) return;
    setProcesando(true);

    try {
      const img = imgRef.current;
      const box = contenedorRef.current.getBoundingClientRect();
      const imgRect = img.getBoundingClientRect();

      const canvas = document.createElement('canvas');
      const tamanoFinal = 500;
      canvas.width = tamanoFinal;
      canvas.height = tamanoFinal;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('No se pudo inicializar el lienzo 2D');
      }

      // Fondo oscuro/neutro por si se hace zoom out extremo
      ctx.fillStyle = '#1A2332';
      ctx.fillRect(0, 0, tamanoFinal, tamanoFinal);

      // Calcular posición y tamaño de la imagen sobre el canvas de 500x500
      const ratioCanvasBox = tamanoFinal / TAMANO_BOX;
      const renderX = (imgRect.left - box.left) * ratioCanvasBox;
      const renderY = (imgRect.top - box.top) * ratioCanvasBox;
      const renderW = imgRect.width * ratioCanvasBox;
      const renderH = imgRect.height * ratioCanvasBox;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.drawImage(img, renderX, renderY, renderW, renderH);

      canvas.toBlob(async (blob) => {
        if (!blob) {
          throw new Error('Error al generar imagen');
        }
        const archivoFinal = new File([blob], 'avatar-1-1.jpg', {
          type: 'image/jpeg',
          lastModified: Date.now()
        });

        const archivoComprimido = await comprimirFotoPerfil(archivoFinal);
        alConfirmar(archivoComprimido);
      }, 'image/jpeg', 0.88);

    } catch (err) {
      console.error('Error al recortar avatar:', err);
      alConfirmar(archivoOriginal);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.78)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2100,
      padding: '16px'
    }}>
      <div style={{
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1.5px solid var(--border-color)',
        maxWidth: '480px',
        width: '100%',
        padding: '24px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px'
      }}>
        {/* Cabecera */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Crop size={20} color="var(--accent-forest)" />
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
              Ajustar Foto de Perfil (1:1)
            </h3>
          </div>
          <button 
            type="button" 
            onClick={alCancelar}
            className="btn-icon"
            style={{ cursor: 'pointer', background: 'none', border: 'none', color: 'var(--text-secondary)' }}
          >
            <X size={20} />
          </button>
        </div>

        <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
          Arrastra la foto y usa el control de zoom para encuadrarla dentro del marco cuadrado. Puedes alejarla o acercarla a tu gusto.
        </p>

        {/* Visor de Recorte 1:1 */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div
            ref={contenedorRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
            style={{
              position: 'relative',
              width: `${TAMANO_BOX}px`,
              height: `${TAMANO_BOX}px`,
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              cursor: arrastrando ? 'grabbing' : 'grab',
              background: '#0B1118',
              border: '2px solid var(--accent-forest)',
              boxShadow: 'inset 0 0 20px rgba(0,0,0,0.6)',
              userSelect: 'none',
              touchAction: 'none'
            }}
          >
            {imagenSrc && (
              <img
                ref={imgRef}
                src={imagenSrc}
                alt="Para recortar"
                onLoad={alCargarImagen}
                draggable={false}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: `${dimensionesBase.ancho}px`,
                  height: `${dimensionesBase.alto}px`,
                  transform: `translate(calc(-50% + ${posicion.x}px), calc(-50% + ${posicion.y}px)) scale(${zoom})`,
                  transformOrigin: 'center center',
                  maxWidth: 'none',
                  maxHeight: 'none',
                  pointerEvents: 'none'
                }}
              />
            )}

            {/* Máscara Circular y Guías de Encuadre */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: '50%',
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.55)',
              border: '2px dashed rgba(255, 255, 255, 0.75)',
              pointerEvents: 'none'
            }} />

            {/* Indicador de arrastre */}
            <div style={{
              position: 'absolute',
              bottom: '8px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.6)',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '0.72rem',
              color: '#FFFFFF',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Move size={12} /> Arrastra para centrar
            </div>
          </div>
        </div>

        {/* Controles de Zoom */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 10px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setZoom(prev => Math.max(0.5, Number((prev - 0.15).toFixed(2))))}
            title="Reducir zoom (alejar)"
            style={{ padding: '6px 10px' }}
          >
            <ZoomOut size={16} />
          </button>

          <input
            type="range"
            min="0.5"
            max="3.0"
            step="0.05"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--accent-forest)' }}
          />

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setZoom(prev => Math.min(3.0, Number((prev + 0.15).toFixed(2))))}
            title="Aumentar zoom (acercar)"
            style={{ padding: '6px 10px' }}
          >
            <ZoomIn size={16} />
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={restablecer}
            title="Restablecer encuadre y zoom"
            style={{ padding: '6px 10px' }}
          >
            <RotateCcw size={16} />
          </button>
        </div>

        {/* Botones de Acción */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={alCancelar}
            disabled={procesando}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={recortarYAplicar}
            disabled={procesando}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
          >
            <Check size={16} />
            <span>{procesando ? 'Procesando...' : 'Aplicar y Recortar 1:1'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
