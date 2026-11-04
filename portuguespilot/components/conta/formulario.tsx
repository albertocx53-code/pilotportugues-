'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { useAviso } from '@/components/ui/toast';
import type { Perfil } from '@/lib/auth';

const ETAPAS = [
  ['fundamental1', 'Fundamental I'],
  ['fundamental2', 'Fundamental II'],
  ['medio', 'Ensino Médio'],
  ['eja', 'EJA'],
  ['superior', 'Superior'],
  ['outro', 'Outro'],
] as const;

const ANOS = [
  '1º ano',
  '2º ano',
  '3º ano',
  '4º ano',
  '5º ano',
  '6º ano',
  '7º ano',
  '8º ano',
  '9º ano',
  '1ª série EM',
  '2ª série EM',
  '3ª série EM',
];

export function FormularioDoPerfil({
  perfil,
  email,
}: {
  perfil: Perfil;
  email: string;
}) {
  const [nome, setNome] = useState(perfil.full_name ?? '');
  const [escola, setEscola] = useState(perfil.school ?? '');
  const [cidade, setCidade] = useState(perfil.city ?? '');
  const [etapa, setEtapa] = useState(perfil.stage ?? 'fundamental2');
  const [anos, setAnos] = useState<string[]>(perfil.grades ?? []);
  const [salvando, setSalvando] = useState(false);

  const router = useRouter();
  const { avisar } = useAviso();

  function alternarAno(ano: string) {
    setAnos((atual) =>
      atual.includes(ano) ? atual.filter((a) => a !== ano) : [...atual, ano],
    );
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);

    const { error } = await supabaseBrowser()
      .from('profiles')
      .update({
        full_name: nome.trim().slice(0, 120),
        school: escola.trim().slice(0, 160),
        city: cidade.trim().slice(0, 120),
        stage: etapa,
        grades: anos.slice(0, 12),
      })
      .eq('id', perfil.id);

    if (error) avisar('Não foi possível salvar. Tente novamente.', 'erro');
    else {
      avisar('Dados salvos.', 'ok');
      router.refresh();
    }
    setSalvando(false);
  }

  return (
    <form onSubmit={salvar} className="folha p-5 sm:p-6">
      <h2 className="font-semibold">Seus dados</h2>
      <p className="mt-1.5 text-sm text-grafite">
        O nome aparece nos materiais exportados. As turmas alimentam as sugestões do
        painel.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          Nome
          <input
            className="campo mt-1.5"
            maxLength={120}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
        </label>
        <label className="block text-sm font-medium">
          E-mail
          <input className="campo mt-1.5" value={email} disabled readOnly />
        </label>
        <label className="block text-sm font-medium">
          Escola
          <input
            className="campo mt-1.5"
            maxLength={160}
            value={escola}
            onChange={(e) => setEscola(e.target.value)}
          />
        </label>
        <label className="block text-sm font-medium">
          Cidade
          <input
            className="campo mt-1.5"
            maxLength={120}
            value={cidade}
            onChange={(e) => setCidade(e.target.value)}
          />
        </label>
        <label className="block text-sm font-medium">
          Etapa principal
          <select
            className="campo mt-1.5"
            value={etapa}
            onChange={(e) => setEtapa(e.target.value)}
          >
            {ETAPAS.map(([id, rotulo]) => (
              <option key={id} value={id}>
                {rotulo}
              </option>
            ))}
          </select>
        </label>
      </div>

      <fieldset className="mt-5">
        <legend className="text-sm font-medium">Anos que você leciona</legend>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {ANOS.map((ano) => {
            const ativo = anos.includes(ano);
            return (
              <button
                key={ano}
                type="button"
                aria-pressed={ativo}
                onClick={() => alternarAno(ano)}
                className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                  ativo
                    ? 'border-pena bg-pena text-white dark:text-[#0c1120]'
                    : 'border-linha bg-papel text-tinta-2 hover:border-grafite-2'
                }`}
              >
                {ano}
              </button>
            );
          })}
        </div>
      </fieldset>

      <button disabled={salvando} className="botao mt-6">
        {salvando ? (
          <Loader2 size={16} className="girando" aria-hidden />
        ) : (
          <Save size={16} aria-hidden />
        )}
        {salvando ? 'Salvando...' : 'Salvar alterações'}
      </button>
    </form>
  );
}
