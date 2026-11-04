'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Loader2, Star, Trash2 } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { useAviso } from '@/components/ui/toast';

export function AcoesDoMaterial({
  id,
  favorito,
  titulo,
}: {
  id: string;
  favorito: boolean;
  titulo: string;
}) {
  const [fav, setFav] = useState(favorito);
  const [ocupado, setOcupado] = useState<'fav' | 'copia' | 'exclui' | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const router = useRouter();
  const { avisar } = useAviso();

  async function alternarFavorito() {
    setOcupado('fav');
    const novo = !fav;
    setFav(novo);
    const { error } = await supabaseBrowser()
      .from('materials')
      .update({ is_favorite: novo })
      .eq('id', id);
    if (error) {
      setFav(!novo);
      avisar('Não foi possível mudar o favorito.', 'erro');
    }
    setOcupado(null);
    router.refresh();
  }

  async function duplicar() {
    setOcupado('copia');
    const { error } = await supabaseBrowser().rpc('duplicate_material', { p_id: id });
    if (error) avisar('Não foi possível duplicar o material.', 'erro');
    else avisar('Cópia criada.', 'ok');
    setOcupado(null);
    router.refresh();
  }

  async function excluir() {
    setOcupado('exclui');
    const { error } = await supabaseBrowser().from('materials').delete().eq('id', id);
    if (error) {
      avisar('Não foi possível excluir o material.', 'erro');
      setOcupado(null);
      return;
    }
    avisar(`“${titulo}” foi excluído.`, 'ok');
    setConfirmando(false);
    setOcupado(null);
    router.refresh();
  }

  if (confirmando) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-grafite">Excluir de vez?</span>
        <button
          onClick={excluir}
          disabled={ocupado !== null}
          className="rounded-md bg-correcao px-2.5 py-1 text-xs font-semibold text-white"
        >
          {ocupado === 'exclui' ? 'Excluindo...' : 'Excluir'}
        </button>
        <button
          onClick={() => setConfirmando(false)}
          className="px-1.5 text-xs font-semibold text-grafite hover:text-tinta"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0.5">
      <button
        onClick={alternarFavorito}
        disabled={ocupado !== null}
        aria-pressed={fav}
        aria-label={fav ? 'Remover dos favoritos' : 'Marcar como favorito'}
        className="rounded-lg p-2 text-grafite-2 transition-colors hover:bg-papel-2 hover:text-tinta"
      >
        <Star size={16} className={fav ? 'fill-current text-marca-texto' : ''} />
      </button>
      <button
        onClick={duplicar}
        disabled={ocupado !== null}
        aria-label="Duplicar material"
        className="rounded-lg p-2 text-grafite-2 transition-colors hover:bg-papel-2 hover:text-tinta"
      >
        {ocupado === 'copia' ? (
          <Loader2 size={16} className="girando" />
        ) : (
          <Copy size={16} />
        )}
      </button>
      <button
        onClick={() => setConfirmando(true)}
        disabled={ocupado !== null}
        aria-label="Excluir material"
        className="rounded-lg p-2 text-grafite-2 transition-colors hover:bg-correcao-clara hover:text-correcao"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
